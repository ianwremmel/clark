import debugFactory from 'debug';
import {log} from '../log';
import {exec, gather} from '../packages';

const debug = debugFactory('clark:lib:handlers:exec');

/**
 * Contains the handler for the exec command
 */
export namespace Exec {
  /**
   * Implementation of the exec command
   * @param options
   */
  export async function handler(options: Options): Promise<void> {
    const {command} = options;
    const packages = await gather(options);
    log(
      options,
      debug,
      `Running "${command}" against ${packages.length} packages`,
    );
    for (const packageName of packages) {
      log(options, debug, `Running ${command} against ${packageName}`);
      await exec(command, packageName);
      log(options, debug, `Ran ${command} against ${packageName}`);
    }
    log(options, debug, `Ran "${command}" against ${packages.length} packages`);
  }

  /**
   * Exec handler options
   */
  export interface Options extends log.Options {
    packageName?: string | string[];
    command: string;
  }
}
