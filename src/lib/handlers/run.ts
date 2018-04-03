import {Argv} from 'yargs';
import {load} from '../config';
import {execScript, gather} from '../packages';

export namespace Run {
  export function builder(yargs: Argv): Argv {
    const config = load();

    if (config.scripts && config.scripts) {
      return Object.entries(config.scripts).reduce(
        (y, [command, script]: [string, string]): Argv =>
          y.command(
            command,
            `the "${command}" command is generated from your local .clarkrc. It runs "${script} "in each package directory.`,
            (yargs2) => {
              return yargs2.option('package-name', {
                alias: ['p', 'package'],
                describe:
                  'The package against which to run this command. May be specified more than once.',
                type: 'string',
              });
            },
            async (argv): Promise<void> => {
              for (const packageName of await gather(argv as gather.Options)) {
                await execScript(command, packageName, script);
              }
            },
          ),
        yargs,
      );
    }

    return yargs;
  }

  export async function handler(options: Options): Promise<void> {}

  export interface Options {}
}
