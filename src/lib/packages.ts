import debugFactory from 'debug';
import {sync as glob} from 'glob';
import {readFile, writeFile} from 'mz/fs';
import {dirname, resolve} from 'path';
import {read as readRootPackage, write as writeRootPackage} from './project';
import {spawn} from './spawn';

const debug = debugFactory('clark:lib:packages');

const cwd = 'packages/node_modules';

/**
 * Lists all packages in the monorepo
 */
export async function list(): Promise<string[]> {
  debug('listing all packages');
  const directories = glob('**/package.json', {cwd});
  debug(`found "${directories.length}" packages`);
  return directories.map(dirname);
}

/**
 * Indicates if a given packageName identifies a package in the monorepo
 * @param packageName
 */
export async function isPackage(packageName: string): Promise<boolean> {
  debug(`checking if "${packageName}" identifies a package`);
  const directories = glob(`${packageName}/package.json`, {cwd});
  switch (directories.length) {
    case 0:
      debug(`"${packageName}" does not identify a package`);
      return false;
    case 1:
      debug(`"${packageName}" identifies a package`);
      return true;
    default:
      throw new Error(
        `"${packageName}" appears to represent multiple packages`,
      );
  }
}

/**
 * Higher-level version of that "does the right thing" whether package
 * packageName is provided or not.
 * @param options
 */
export async function gather({packageName}: gather.Options): Promise<string[]> {
  if (packageName) {
    if (Array.isArray(packageName)) {
      return packageName;
    } else {
      return [packageName];
    }
  }
  return await list();
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
 * Indicates if the specified package has an implementation of the specified
 * npm script
 * @param packageName
 * @param scriptName
 */
export async function hasScript(
  packageName: string,
  scriptName: string,
): Promise<boolean> {
  debug(`checking if "${packageName}" has a "${scriptName}" script`);
  const pkg = JSON.parse(
    await readFile(
      resolve('packages', 'node_modules', packageName, 'package.json'),
      'utf-8',
    ),
  );
  const has = !!(pkg.scripts && pkg.scripts[scriptName]);
  debug(
    `"${packageName}" ${
      has ? ' has ' : ' does not have '
    } a script named "${scriptName}"`,
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
export async function hoist(packageName: string): Promise<void> {
  debug(`Reading deps from "${packageName}"`);
  const pkg = await read(packageName);
  const rootPkg = await readRootPackage();

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  for (const [depName, depVersion] of Object.entries(deps)) {
    debug(
      `Checking if root package has version of "${depName}" that conflicts with "${depVersion}"`,
    );
    if (
      rootPkg.dependencies[depName] &&
      rootPkg.dependencies[depName] !== depVersion
    ) {
      throw new Error(
        `Cowardly refusing to overwrite mismatched semver for "${depName}" from "${packageName}"`,
      );
    }
    debug(
      `Root package does not have conflicting version of "${depName}" that conflicts with "${depVersion}"`,
    );
    rootPkg.dependencies[depName] = depVersion;
  }

  delete pkg.dependencies;
  delete pkg.devDependencies;
  await write(packageName, pkg);
  await writeRootPackage(rootPkg);
}

/**
 * Reads a package.json from the monorepo
 * @param packageName
 */
export async function read(packageName: string) {
  return JSON.parse(
    await readFile(
      resolve('packages', 'node_modules', packageName, 'package.json'),
      'utf-8',
    ),
  );
}

/**
 * Writes a new package.json to the appropriate package
 * @param packageName
 * @param pkg
 */
export async function write(packageName: string, pkg: object) {
  return await writeFile(
    resolve('packages', 'node_modules', packageName, 'package.json'),
    `${JSON.stringify(pkg, null, 2)}\n`,
  );
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
  debug(`Running "${scriptName}" in "${packageName}"`);
  if (await hasScript(packageName, scriptName)) {
    return await exec(`npm run --silent ${scriptName}`, packageName);
  }

  if (!fallbackScript) {
    throw new Error(`${packageName} does not implement ${scriptName}`);
  }

  debug(`Falling back to run "${scriptName}" in "${packageName}"`);
  return await exec(fallbackScript, packageName);
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

  debug(`running command "${cmd}" in directory for package "${packageName}"`);
  const bin = 'bash';
  const args = ['-c', cmd];
  try {
    const result = await spawn(bin, args, {cwd: resolve(cwd, packageName)});
    debug(`ran command "${cmd}" in directory for package "${packageName}"`);
    return result;
  } catch (err) {
    debug(`command "${cmd}" failed for package "${packageName}"`);
    throw err;
  }
}
