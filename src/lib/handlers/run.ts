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
              for (const packageName of packages) {
                log(
                  argv as log.Options,
                  debug,
                  `Running ${command} against ${packageName} packages`,
                );
                await execScript(command, packageName, script);
                log(
                  argv as log.Options,
                  debug,
                  `Ran ${command} against ${packageName} packages`,
                );
              }
              log(
                argv as log.Options,
                debug,
                `Ran ${command} against ${packages.length} packages`,
              );
            },
          ),
        yargs,
      );
    }

    return yargs;
  }

  /**
   * Implementation of the run command
   * @param options
   */
  export async function handler(): Promise<void> {
    // noop
  }
}
