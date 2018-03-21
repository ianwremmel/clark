import debugFactory from 'debug';
import {exec, gather} from '../packages';

const debug = debugFactory('clark:lib:handlers:exec');

/**
 * Contains the handler for the exec command
 */
export namespace Exec {
  /**
   * Wrapper around exec that includes debug statements
   * @param command the command to run
   * @param packageName the package against which to run the command
   */
  async function run(command: string, packageName: string) : Promise<void> {
    debug(`Running "${command}" against specified package "${packageName}"`);
    await exec(command, packageName);
    debug(`Ran "${command}" against specified package "${packageName}"`);
  }

  /**
   * Implementation of the exec command
   * @param options
   */
  export async function handler(options: Options) : Promise<void> {
    const {command} = options;
    const packages = await gather(options);
    debug(`Running "${command}" against ${packages.length} packages`);
    for (const _packageName of packages) {
      await run(command, _packageName);
    }
    debug(`Ran "${command}" against ${packages.length} packages`);
  }


  /**
   * Exec handler options
   */
  export interface Options {
    packageName?: string | string[];
    command: string;
  }
}
