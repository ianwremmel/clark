import debugFactory from 'debug';
import {log} from '../log';
import {gather, hoist} from '../packages';

const debug = debugFactory('clark:lib:handlers:hoist');

/**
 * Contains the handler for the hoist command
 */
export namespace Hoist {
  /**
   * Implementation of the hoist command
   * @param options
   */
  export async function handler(options: Options) {
    const packages = await gather(options);
    log(options, debug, `Hoisting ${packages.length} packages`);
    for (const packageName of packages) {
      log(options, debug, `hoisting deps from ${packageName}`);
      await hoist(packageName, {risky: options.risky});
      log(options, debug, `hoisted deps from ${packageName}`);
    }
    log(options, debug, `Hoisted ${packages.length} packages`);
  }

  /**
   * Hoist handler options
   */
  export interface Options extends log.Options {
    packageName?: string | string[];
    risky?: boolean;
  }
}
