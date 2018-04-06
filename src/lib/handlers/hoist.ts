import {format as f, makeDebug} from '../debug';
import {log} from '../log';
import {gather, hoist} from '../packages';

const debug = makeDebug(__dirname);

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
    log(options, debug, f`Hoisting ${packages.length} packages`);
    for (const packageName of packages) {
      log(options, debug, f`hoisting deps from ${packageName}`);
      await hoist(packageName, {risky: options.risky});
      log(options, debug, f`hoisted deps from ${packageName}`);
    }
    log(options, debug, f`Hoisted ${packages.length} packages`);
  }

  /**
   * Hoist handler options
   */
  export interface Options extends log.Options {
    packageName?: string | string[];
    risky?: boolean;
  }
}
