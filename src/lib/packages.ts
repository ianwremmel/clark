import * as debugFactory from 'debug';

import {sync as glob} from 'glob';
import {dirname, resolve} from 'path';
import spawn from './spawn';

const debug = debugFactory('clark:lib:packages');

export namespace packages {
  const cwd = 'packages/node_modules';

  export async function list() : Promise<string[]> {
    debug('listing all packages');
    const directories = glob('**/package.json', {cwd});
    debug(`found ${directories.length} packages`);
    return directories.map(dirname);
  }

  export async function exec(cmd: string, packageName: string) : Promise<undefined> {
    debug(`running command ${cmd} in directory for package ${packageName}`);
    const [bin, ...args] = cmd.split(' ');
    try {
      const result = await spawn(bin, args, {cwd: resolve(cwd, packageName)});
      debug(`ran command ${cmd} in directory for package ${packageName}`);
      return result;
    }
    catch (err) {
      debug(`command ${cmd} failed for package ${packageName}`);
      throw err;
    }
  }
}
