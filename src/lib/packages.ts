import {dirname, resolve} from 'path';

import {sync as glob} from 'glob';
import {exists, existsSync, readFile, writeFile} from 'mz/fs';

import {load} from './config';
import {format as f, makeDebug} from './debug';
import {log} from './log';
import {
  findProjectRoot,
  isAlleRepo,
  read as readRootPackage,
  write as writeRootPackage,
} from './project';
import {spawn} from './spawn';
import {sortObject} from './util';
import {select} from './version';

const debug = makeDebug(__filename);

let pathsByPackage = new Map();
let packagesByPath = new Map();
let initialized = false;

interface EnvObject {
  [key: string]: string;
}

/**
 * Applies the `fn` to the packages specified by `options` and logs as
 * appropriate.
 */
export async function apply(
  {
    before, // = defaultBefore,
    beforeEach, // = defaultBeforeEach,
    afterEach, // = defaultAfterEach,
    after, // = defaultAfter,
  }: apply.Options,
  fn: apply.applyCallback,
  options: apply.InvocationOptions,
) {
  const packages = await gather(options);
  const errors = [];

  log(options, debug, before(packages));
  for (const packageName of packages) {
    log(options, debug, beforeEach(packageName));

    try {
      await fn(packageName);
      log(options, debug, afterEach(packageName));
    } catch (err) {
      errors.push(err);
      if (options.failFast) {
        log(options, debug, afterEach(packageName, err));
      }
    }
  }
  log(options, debug, after(packages, errors));

  if (errors.length) {
    errors.forEach((e) => console.error(e.toString()));
    throw errors[0];
  }
}

export namespace apply {
  /**
   * Logger definitions
   */
  export interface Options {
    before(packages: string[]): string;
    beforeEach(packageName: string): string;
    afterEach(packageName: string, error?: Error): string;
    after(packages: string[], errors: Error[]): string;
  }

  /**
   * Executed against each package
   */
  export type applyCallback = (packageName: string) => Promise<void>;

  /**
   * Options passed from the calling function, in part, to the applyCallback
   */
  export type InvocationOptions = BaseInvocationOptions &
    gather.Options &
    log.Options;

  /**
   * Portion of InvocationOptions relevant to {@link apply}.
   */
  export interface BaseInvocationOptions {
    /**
     * When true, apply will abort after the first failure, otherwise, it will
     * collect errors and log them once all appropriate packages have been
     * processed.
     */
    failFast: boolean;
  }
}

/**
 * Executes the specified command against the specified package
 */
export async function exec(cmd: string, packageName: string): Promise<void> {
  if (!(await isPackage(packageName))) {
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
        PATH: `${resolve(
          await findProjectRoot(),
          'node_modules',
          '.bin',
        )}:${PATH}`,
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
 */
export async function execScript({
  args,
  fallbackScript,
  packageName,
  scriptName,
}: execScript.Options): Promise<void> {
  debug(f`Running script ${scriptName} in ${packageName}`);
  if (await hasScript(packageName, scriptName)) {
    debug('Using override script');
    return exec(
      `npm run --silent ${args ? `${scriptName} -- ${args}` : scriptName}`,
      packageName,
    );
  }

  if (!fallbackScript) {
    debug(
      f`Neither override nor fallback script defined for script ${scriptName}`,
    );
    console.warn(f`${packageName} does not implement ${scriptName}, skipping`);
    return;
  }

  debug(f`Falling back to run ${scriptName} in ${packageName}`);
  return exec(args ? `${fallbackScript} ${args}` : fallbackScript, packageName);
}

export namespace execScript {
  /**
   * Options for execScript()
   */
  export interface Options {
    args?: string;
    fallbackScript?: string;
    packageName: string;
    scriptName: string;
  }
}

/**
 * Removes any `CLARK_` prefixed variables from env before passing them to
 * `spawn()`.
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
 * Lists all the entry points for the specified package
 */
export async function findEntryPoints(packageName: string): Promise<string[]> {
  const pkg = await read(packageName);

  debug(f`listing entrypoints for ${pkg.name}`);
  if (!pkg.name) {
    throw new Error('cannot read dependencies for unnamed package');
  }

  let paths = [];

  if (pkg.main) {
    debug(f`found main path for ${pkg.name}`);
    paths.push(pkg.main);
  }

  if (pkg.bin) {
    debug(f`found bin entry(s) for ${pkg.name}`);
    paths = paths.concat(Object.values(pkg.bin));
  }

  if (pkg.browser) {
    debug(f`found browser entry(s) for ${pkg.name}`);
    paths = paths.concat(
      Object.values(
        pkg.browser as {
          [key: string]: string;
        },
      ).filter((p) => p && !p.startsWith('@')),
    );
  }

  const packagePath = await getPackagePath(packageName);
  const tsconfigPath = resolve(packagePath, 'tsconfig.json');

  debug('checking if this is a typescript project');
  if (await exists(tsconfigPath)) {
    debug('this is a typescript project');
    debug('using tsconfig.json to find all entrypoints');
    const tsconfig = JSON.parse(await readFile(tsconfigPath, 'utf-8')) as {
      include: string[];
    };

    for (const pattern of tsconfig.include) {
      paths = paths.concat(
        glob(pattern, {cwd: packagePath, nodir: true}).filter(
          (p) => p.endsWith('.ts') || p.endsWith('.tsx'),
        ),
      );
    }
  }

  debug(paths);

  const testPattern = /[\.-]spec|test\.[jt]sx?$/;
  return (
    paths
      .map((p) => resolve(packagePath, p))
      // filter out test files
      .filter((p) => !testPattern.test(p))
      // filter out files that don't exist. this may happen, in particular, in
      // scenarios where we're relying on tsconfig.json to identify source files
      // instead of main/bin to identify built artifacts.
      .filter((p) => existsSync(p))
  );
}

/**
 * Higher-level version of that "does the right thing" whether packageName is
 * provided or not.
 */
export async function gather(options: gather.Options): Promise<string[]> {
  options = await infer(options);
  const {packageName} = options;
  if (packageName) {
    if (Array.isArray(packageName)) {
      debug(f`User specified ${packageName.length} packages`);
      return packageName.sort();
    }
    debug('User specified a single package');
    return [packageName];
  }

  debug('User did not specify any packages; listing all packages');
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
 */
export async function getPackagePath(packageName: string): Promise<string> {
  await init();
  if (!(await isPackage(packageName))) {
    throw new Error(`${packageName} does not appear to identify a package`);
  }
  return pathsByPackage.get(packageName);
}

/**
 * Indicates if the specified package has an implementation of the specified
 * npm script
 */
export async function hasScript(
  packageName: string,
  scriptName: string,
): Promise<boolean> {
  debug(f`Checking if ${packageName} has a ${scriptName} script`);
  const pkg = await read(packageName);
  const has = Boolean(pkg.scripts && pkg.scripts[scriptName]);
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
      } catch {
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
 * Only here for testing, this function resets state between tests. (oclif's
 * test framework runs everything in band, so the way the cache is setup fails
 * miserably).
 */
export function reset() {
  pathsByPackage = new Map();
  packagesByPath = new Map();
  initialized = false;
}

/**
 * Indicates if the given packageName identifies a package in the monorpeo
 */
export async function isPackage(packageName: string): Promise<boolean> {
  await init();
  return pathsByPackage.has(packageName);
}

/**
 * Indicates if the given directory contains a package
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
 */
async function listPackagesInGlob(pattern: string): Promise<void> {
  const cwd = await findProjectRoot();
  debug(f`Listing packages in ${cwd} matching ${pattern}`);
  // I'm a little concerned just tacking package.json on the end could break
  // certain glob patterns, but I don't have any proof to back that up.
  const paths = glob(`${pattern}/package.json`, {cwd});
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
 */
export async function write(packageName: string, pkg: object) {
  const packagePath = resolve(
    await findProjectRoot(),
    await getPackagePath(packageName),
    'package.json',
  );
  debug(f`Writing package ${packageName} at path ${packagePath}`);

  return writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}
