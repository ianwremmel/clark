import {format as f} from '../debug';
import {apply, exec} from '../packages';

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
    await apply(
      {
        before: (packages) =>
          f`Running ${command} against ${packages.length} packages`,
        beforeEach: (packageName) =>
          f`Running ${command} against ${packageName}`,
        afterEach: (packageName, error) => {
          if (error) {
            return `${command} failed against ${packageName}`;
          }
          return `Ran ${command} against ${packageName}`;
        },
        after: (packages, errors) => {
          if (errors.length) {
            return f`clark exec failed to execute the following command against ${
              errors.length
            } packages\n> ${command}\n`;
          }

          return `Ran ${command} successfully against ${packages.length}`;
        },
      },
      async (packageName: string) => {
        await exec(command, packageName);
      },
      options,
    );
  }

  /**
   * Exec handler options
   */
  export interface Options extends apply.InvocationOptions {
    packageName?: string | string[];
    command: string;
  }
}
