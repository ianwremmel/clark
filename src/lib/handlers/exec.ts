import debugFactory from 'debug';
import {exec, gather} from '../packages';

const debug = debugFactory('clark:lib:handlers:exec');

export namespace Exec {
  async function run(command: string, packageName: string) : Promise<void> {
    debug(`Running "${command}" against specified package "${packageName}"`);
    await exec(command, packageName);
    debug(`Ran "${command}" against specified package "${packageName}"`);
  }

  export async function handler(options: Options) : Promise<void> {
    const {command} = options;
    const packages = await gather(options);
    debug(`Running "${command}" against ${packages.length} packages`);
    for (const _packageName of packages) {
      await run(command, _packageName);
    }
    debug(`Ran "${command}" against ${packages.length} packages`);
  }

  export interface Options {
    packageName?: string | string[];
    command: string;
  }
}
