import debugFactory from 'debug';
import {Argv} from 'yargs';
import {load} from '../config';
import {log} from '../log';
import {execScript, gather} from '../packages';

const debug = debugFactory('clark:lib:handlers:run');

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
            `the "${command}" command is generated from your local .clarkrc. It runs "${script} "in each package directory.`,
            yargs2 => {
              return yargs2.option('package-name', {
                alias: ['p', 'package'],
                describe:
                  'The package against which to run this command. May be specified more than once.',
                type: 'string',
              });
            },
            async (argv): Promise<void> => {
              const packages = await gather(argv as gather.Options);
              log(
                argv as log.Options,
                debug,
                `Running ${command} against ${packages.length} packages`,
              );
              const errors = [];
              for (const packageName of packages) {
                log(
                  argv as log.Options,
                  debug,
                  `Running ${command} against ${packageName} packages`,
                );
                try {
                  await execScript(command, packageName, script);
                } catch (err) {
                  log(
                    argv as log.Options,
                    debug,
                    `${command} failed against ${packageName}`,
                  );
                  errors.push(err);
                }
                log(
                  argv as log.Options,
                  debug,
                  `Ran ${command} against ${packageName}`,
                );
              }
              log(
                argv as log.Options,
                debug,
                `Ran ${command} against ${packages.length} packages`,
              );

              if (errors.length) {
                console.error(
                  argv as log.Options,
                  debug,
                  `clark run failed to execute the following command against ${
                    errors.length
                  } packages\n> ${command}\n`,
                );
                console.error(argv as log.Options, debug, errors);
                process.exit(1);
              }
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
