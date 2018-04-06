import {sync as glob} from 'glob';
import {readFile, writeFile} from 'mz/fs';
import {dirname, resolve} from 'path';
import {load} from './config';
import {format as f, makeDebug} from './debug';
import {
  findProjectRoot,
  isAlleRepo,
  read as readRootPackage,
  write as writeRootPackage,
} from './project';
import {spawn} from './spawn';
import {sortObject} from './util';
import {select} from './version';

const debug = makeDebug(__dirname);

const pathsByPackage = new Map();
const packagesByPath = new Map();
let initialized = false;

interface EnvObject {
  [key: string]: string;
}

/**
 * Executes the specified command against the specified package
 * @param cmd
 * @param packageName
 */
export async function exec(cmd: string, packageName: string): Promise<void> {
  if (!await isPackage(packageName)) {
    throw new Error(`"${packageName}" does not appear to identify a package`);
  }

  debug(f`running command ${cmd} in directory for package ${packageName}`);
  const bin = 'bash';
  const args = ['-c', cmd];
  const {PATH, ...env} = process.env;
  const clarkEnv = {
    CLARK_PACKAGE_ABS_PATH: resolve(
      await findProjectRoot(),
      await getPackagePath(packageName),
    ),
    CLARK_PACKAGE_NAME: packageName,
    CLARK_PACKAGE_REL_PATH: await getPackagePath(packageName),
    CLARK_ROOT_PATH: await findProjectRoot(),
    ...filterEnv(env),
  };

  try {
    const result = await spawn(bin, args, {
      cwd: resolve(await findProjectRoot(), await getPackagePath(packageName)),
      env: {
        ...clarkEnv,
        PATH: `${PATH}:${resolve(
          await findProjectRoot(),
          'node_modules',
          '.bin',
        )}`,
      },
    });
    debug(f`ran command ${cmd} in directory for package ${packageName}`);
    return result;
  } catch (err) {
    debug(f`command ${cmd} failed for package ${packageName}`);
    throw err;
  }
}

/**
 * Executes the specified npm script in the specified package. If the package
 * does not have a definition for the script and fallbackScript is provided,
 * then fallbackScript will be executed directly (i.e., run as a bash command,
 * not as an npm script).
 * @param scriptName
 * @param packageName
 * @param fallbackScript
 */
export async function execScript(
  scriptName: string,
  packageName: string,
  fallbackScript?: string,
): Promise<void> {
  debug(f`Running script ${scriptName} in ${packageName}`);
  if (await hasScript(packageName, scriptName)) {
    debug('Using override script');
    return await exec(`npm run --silent ${scriptName}`, packageName);
  }

  if (!fallbackScript) {
    debug(
      f`Neither override nor fallback script defined for script ${scriptName}`,
    );
    throw new Error(`${packageName} does not implement ${scriptName}`);
  }

  debug(f`Falling back to run ${scriptName} in ${packageName}`);
  return await exec(fallbackScript, packageName);
}

/**
 * Removes any `CLARK_` prefixed variables from env before passing them to
 * `spawn()`.
 * @param env
 */
function filterEnv(env: object): object {
  return Object.entries(env).reduce<EnvObject>((acc, [key, value]) => {
    if (!key.startsWith('CLARK_')) {
      acc[key] = value;
    }

    return acc;
  }, {});
}

/**
 * Higher-level version of that "does the right thing" whether packageName is
 * provided or not.
 * @param options
 */
export async function gather(options: gather.Options): Promise<string[]> {
  options = await infer(options);
  const {packageName} = options;
  if (packageName) {
    if (Array.isArray(packageName)) {
      debug(f`User specified ${packageName.length} packages`);
      return packageName.sort();
    } else {
      debug('User specified a single package');
      return [packageName];
    }
  }

  debug('User did not specify an packages; listing all packages');
  return (await list()).sort();
}

export namespace gather {
  /**
   * Options for gather()
   */
  export interface Options {
    packageName?: string | string[];
  }
}

/**
 * Returns the relative path from the monorepo root to the directory containing
 * the specified package's package.json.
 * @param packageName
 */
export async function getPackagePath(packageName: string): Promise<string> {
  await init();
  if (!await isPackage(packageName)) {
    throw new Error(`${packageName} does not appear to identify a package`);
  }
  return pathsByPackage.get(packageName);
}

/**
 * Indicates if the specified package has an implementation of the specified
 * npm script
 * @param packageName
 * @param scriptName
 */
export async function hasScript(
  packageName: string,
  scriptName: string,
): Promise<boolean> {
  debug(f`Checking if ${packageName} has a ${scriptName} script`);
  const pkg = await read(packageName);
  const has = !!(pkg.scripts && pkg.scripts[scriptName]);
  debug(
    f`${packageName} ${
      has ? ' has ' : ' does not have '
    } a script named ${scriptName}`,
  );
  return has;
}

/**
 * Moves dependencies and dev dependencies from the specified package's
 * package.json to the dependencies section of the root package.json. Note that
 * dependencies and devDepenencies are combined because the distinction loses
 * meaning in a monorepo (arguably, they should all be devDependencies, but
 * that's not where `npm install` defaults).
 * @param packageName
 */
export async function hoist(
  packageName: string,
  options: hoist.Options = {risky: false},
): Promise<void> {
  debug(f`Reading deps from ${packageName}`);
  const pkg = await read(packageName);
  const rootPkg = await readRootPackage();

  rootPkg.dependencies = rootPkg.dependencies || {};

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  for (const [depName, depVersion] of Object.entries(deps)) {
    const rootVersion = rootPkg.dependencies[depName];

    if (!rootVersion) {
      debug(
        f`Root package does not yet have a version of ${depName}, defaulting to ${packageName}'s version of ${depVersion}`,
      );
      rootPkg.dependencies[depName] = depVersion;
    } else if (options.risky) {
      debug(
        f`Checking if root ${depName}@${rootVersion} is loosely compatible with ${depName}@${depVersion}`,
      );

      try {
        const toUseVersion = select(rootVersion, depVersion as string);
        rootPkg.dependencies[depName] = toUseVersion;
        debug(
          f`"root ${depName}@${rootVersion} is loosely compatible with ${packageName} ${depName}@${depVersion}`,
        );
      } catch (err) {
        debug(
          f`"root ${depName}@${rootVersion} is not loosely compatible with ${packageName} ${depName}@${depVersion}`,
        );
        throw new Error(
          `Cowardly refusing to overwrite "${depName}@${rootVersion}" for "${depName}@${depVersion}" from "${packageName}"`,
        );
      }
    } else {
      debug(
        f`Checking if root ${depName}@${rootVersion} is strictly compatible with ${depName}@${depVersion}`,
      );
      if (rootVersion !== depVersion) {
        debug(
          f`"root ${depName}@${rootVersion} is not strictly compatible with ${packageName} ${depName}@${depVersion}`,
        );
        throw new Error(
          `Cowardly refusing to overwrite "${depName}@${rootVersion}" for "${depName}@${depVersion}" from "${packageName}"`,
        );
      }
      debug(
        f`"root ${depName}@${rootVersion} is strictly compatible with ${packageName} ${depName}@${depVersion}`,
      );
      rootPkg.dependencies[depName] = depVersion;
    }
  }

  delete pkg.dependencies;
  delete pkg.devDependencies;

  if (!isAlleRepo(await listPaths())) {
    rootPkg.dependencies[packageName] = `file:./${await getPackagePath(
      packageName,
    )}`;
  }

  rootPkg.dependencies = sortObject(rootPkg.dependencies);

  await write(packageName, pkg);
  await writeRootPackage(rootPkg);
}

export namespace hoist {
  /**
   * Options for the hoist function
   */
  export interface Options {
    risky?: boolean;
  }
}

/**
 * Attempts to infer the intended packageName from the current directory
 * @param options
 */
export async function infer(
  options: MaybeSpecifiesPackageName,
): Promise<SpecifiesPackageName | DoesNotSpecifyPackageName> {
  debug('Inferring packageName if necessary');
  if (options.packageName) {
    debug('packageName was specified, not inferring');
    return options;
  }

  if (options.packageName === false) {
    debug('packageName inferrence has been disabled');
    return options;
  }

  debug('packageName was not specified');
  await init();

  const relCwd = process
    .cwd()
    .replace(await findProjectRoot(), '')
    .replace(/^\//, '');

  if (await isPackagePath(relCwd)) {
    debug('Inferred packageName');
    options.packageName = packagesByPath.get(relCwd);
  } else {
    debug('Could not infer packageName');
  }

  return options;
}

/**
 * Describes an Options object that might have a packageName property
 */
export interface MaybeSpecifiesPackageName {
  packageName?: string | string[] | false;
}

/**
 * Describes an Options object that has a packageName property
 */
export interface SpecifiesPackageName {
  packageName: string | string[];
}

/**
 * Describes an Options object that does not have a packageName property
 */
export interface DoesNotSpecifyPackageName {}

/**
 * Helper
 */
async function init(): Promise<void> {
  if (!initialized) {
    initialized = true;
    debug('Globbing for packages');
    const patterns = (await load()).include || [];
    for (const pattern of Array.isArray(patterns) ? patterns : [patterns]) {
      await listPackagesInGlob(pattern);
    }
  }
}

/**
 * Indicates if the given packageName identifies a package in the monorpeo
 * @param packageName
 */
export async function isPackage(packageName: string): Promise<boolean> {
  await init();
  return pathsByPackage.has(packageName);
}

/**
 * Indicates if the given directory contains a package
 * @param dir
 */
export async function isPackagePath(dir: string): Promise<boolean> {
  await init();
  return packagesByPath.has(dir);
}

/**
 * Returns the names of the packages defined in the project
 *
 * Note: This packages are the package.json names, not necessarily the directory
 * paths containing the packages.
 */
export async function list(): Promise<string[]> {
  await init();
  return [...pathsByPackage.keys()];
}

/**
 * Loads all packages found in a particular glob pattern
 *
 * @param pattern
 */
async function listPackagesInGlob(pattern: string): Promise<void> {
  debug(f`Listing packages in ${pattern}`);
  // I'm a little concerned just tacking package.json on the end could break
  // certain glob patterns, but I don't have any proof to back that up.
  const paths = glob(`${pattern}/package.json`, {cwd: await findProjectRoot()});
  debug(f`Found ${paths.length} directories in ${pattern}`);

  for (const packagePath of paths) {
    debug(f`Getting name of package at ${packagePath} from package.json`);
    const dir = dirname(packagePath);
    const pkg = JSON.parse(
      await readFile(resolve(await findProjectRoot(), packagePath), 'utf-8'),
    );
    debug(f`Found ${pkg.name} in ${dir}`);
    if (pathsByPackage.has(pkg.name) && pathsByPackage.get(pkg.name) !== dir) {
      throw new Error(
        `Package names must be unique. ${
          pkg.name
        } found in ${dir} and ${pathsByPackage.get(pkg.name)}`,
      );
    }
    pathsByPackage.set(pkg.name, dir);
    packagesByPath.set(dir, pkg.name);
  }
}

/**
 * Returns the directory paths of each package.json
 */
export async function listPaths(): Promise<string[]> {
  await init();
  return [...packagesByPath.keys()];
}

/**
 * Reads a package.json from the monorepo
 * @param packageName
 */
export async function read(packageName: string) {
  const packagePath = resolve(
    await findProjectRoot(),
    await getPackagePath(packageName),
    'package.json',
  );
  debug(f`Reading package ${packageName} at path ${packagePath}`);
  return JSON.parse(await readFile(packagePath, 'utf-8'));
}

/**
 * Writes a new package.json to the appropriate package
 * @param packageName
 * @param pkg
 */
export async function write(packageName: string, pkg: object) {
  const packagePath = resolve(
    await findProjectRoot(),
    await getPackagePath(packageName),
    'package.json',
  );
  debug(f`Writing package ${packageName} at path ${packagePath}`);

  return await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}
