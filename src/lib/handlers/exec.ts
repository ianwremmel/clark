import {format as f, makeDebug} from '../debug';
import {log} from '../log';
import {exec, gather} from '../packages';

const debug = makeDebug(__dirname);

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
      f`Running ${command} against ${packages.length} packages`,
    );
    const errors = [];

    for (const packageName of packages) {
      log(options, debug, `Running ${command} against ${packageName}`);
      try {
        await exec(command, packageName);
      } catch (err) {
        errors.push(err);
        log(
          options,
          debug,
          f`${command} failed against ${packageName} packages`,
        );
      }
      log(options, debug, `Ran ${command} against ${packageName}`);
    }
    log(options, debug, `Ran ${command} against ${packages.length} packages`);

    if (errors.length) {
      console.error(
        f`clark exec failed to execute the following command against ${
          errors.length
        } packages\n> ${command}\n`,
      );
      console.error(errors);
      process.exit(1);
    }
  }

  /**
   * Exec handler options
   */
  export interface Options extends log.Options {
    packageName?: string | string[];
    command: string;
  }
}
