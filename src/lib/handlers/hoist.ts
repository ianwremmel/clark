import debugFactory from 'debug';
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
    debug(`Hoisting ${packages.length} packages`);
    for (const packageName of packages) {
      debug(`hoisting deps from ${packageName}`);
      await hoist(packageName);
      debug(`hoisted deps from ${packageName}`);
    }
    debug(`Hoisted ${packages.length} packages`);
  }

  /**
   * Hoist handler options
   */
  export interface Options {
    packageName?: string | string[];
  }
}
