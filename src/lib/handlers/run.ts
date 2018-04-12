import {Argv} from 'yargs';
import {load} from '../config';
import {format as f} from '../debug';
import {log} from '../log';
import {apply, execScript} from '../packages';

/**
 * Contains the handler for the run command
 */
export namespace Run {
  /**
   * Builder of the run command (which is also effectively the implementation)
   * @param options
   */
  export function builder(yargs: Argv): Argv {
    const config = load();

    if (config.scripts && config.scripts) {
      return Object.entries(config.scripts).reduce(
        (y, [command, script]: [string, string]): Argv =>
          y.command(
            command,
            f`the ${command} command is generated from your local .clarkrc. It runs ${script} "in each package directory.`,
            (yargs2) => {
              return yargs2.option('package-name', {
                alias: ['p', 'package'],
                describe:
                  'The package against which to run this command. May be specified more than once.',
                type: 'string',
              });
            },
            async (argv): Promise<void> => {
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
                      return f`clark run failed to execute the following command against ${
                        errors.length
                      } packages\n> ${command}\n`;
                    }

                    return `Ran ${command} successfully against ${
                      packages.length
                    }`;
                  },
                },
                async (packageName) => {
                  await execScript(command, packageName, script);
                },
                argv as log.Options,
              );
            },
          ),
        yargs,
      );
    }
    return yargs
      .options({
        'fail-fast': {
          alias: 'ff',
          default: false,
          describe:
            'Fail as soon as a command fails, rather than running all to completion',
          type: 'boolean',
        },
        'package-name': {
          alias: ['p', 'package'],
          describe:
            'The package against which to run this command. May be specified more than once.',
          type: 'string',
        },
      })
      .strict();
  }

  /**
   * Implementation of the run command
   * @param options
   */
  export async function handler(): Promise<void> {
    // noop
  }
}
