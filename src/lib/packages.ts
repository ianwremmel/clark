import debugFactory from 'debug';

import {readFileSync} from 'fs';
import {sync as glob} from 'glob';
import {dirname, resolve} from 'path';
import {spawn} from './spawn';

const debug = debugFactory('clark:lib:packages');

const cwd = 'packages/node_modules';

export async function list() : Promise<string[]> {
  debug('listing all packages');
  const directories = glob('**/package.json', {cwd});
  debug(`found "${directories.length}" packages`);
  return directories.map(dirname);
}

export async function isPackage(packageName: string) : Promise<boolean> {
  debug(`checking if "${packageName}" identifies a package`);
  const directories = glob(packageName + '/' + 'package.json', {cwd});
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

export interface GatherOptions {
  packageName?: string|string[]
}

export async function gather({packageName} : GatherOptions) : Promise<string[]> {
  if (packageName) {
    if (Array.isArray(packageName)) {
      return packageName;
    } else {
      return [packageName];
    }
  }
  return await list();
}

export async function hasScript(
  packageName: string,
  scriptName: string,
) : Promise<boolean> {
  debug(`checking if "${packageName}" has a "${scriptName}" script`);
  const pkg = JSON.parse(
    readFileSync(
      resolve('packages', 'node_modules', packageName, 'package.json'),
      'utf-8',
    ),
  );
  const has = !!(pkg.scripts && pkg.scripts[scriptName]);
  debug(`"${packageName}" ${has ? ' has ' : ' does not have '} a script named "${scriptName}"`);
  return has;
}

export async function execScript(scriptName: string, packageName: string, fallbackScript? : string) : Promise<void> {
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

export async function exec(cmd: string, packageName: string) : Promise<void> {
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
