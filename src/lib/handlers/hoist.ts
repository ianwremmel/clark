import {format as f} from '../debug';
import {log} from '../log';
import {apply, hoist} from '../packages';

/**
 * Contains the handler for the hoist command
 */
export namespace Hoist {
  /**
   * Implementation of the hoist command
   * @param options
   */
  export async function handler(options: Options) {
    await apply(
      {
        before: (packages) => f`Hoisting ${packages.length} packages`,
        beforeEach: (packageName) => f`Hoisting deps from ${packageName}`,
        afterEach: (packageName, error) => {
          if (error) {
            return f`Failed to hoist deps from ${packageName}`;
          }
          return f`Hoisted deps from ${packageName}`;
        },
        after: (packages, errors) => {
          if (errors.length) {
            return `Failed to hoist deps in ${errors.length} packages`;
          }
          return f`Hoisted ${packages.length} packages`;
        },
      },
      async (packageName: string) =>
        await hoist(packageName, {risky: options.risky}),
      options,
    );
  }

  /**
   * Hoist handler options
   */
  export interface Options extends log.Options {
    packageName?: string | string[];
    risky?: boolean;
  }
}
