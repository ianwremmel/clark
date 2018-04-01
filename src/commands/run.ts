import {Argv, CommandModule} from 'yargs';
// import {Run} from '../lib/handlers/run';
import {load} from '../lib/config';
import {execScript, gather} from '../lib/packages';

const RunCommand: CommandModule = {
  command: 'run',

  describe:
    'Runs a script in each package directory. This is different from `exec` in that scripts must be defined in .clarkrc and may be overridden on a per-package basis via npm scripts.',

  builder(yargs) {
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
              for (const packageName of await gather(argv as gather.Options)) {
                await execScript(command, packageName, script);
              }
            },
          ),
        yargs,
      );
    }

    return yargs;
  },

  handler() {
    // noop
  },
};

export = RunCommand;
