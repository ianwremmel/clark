import {Command, flags} from '@oclif/command';

import {format as f} from '../lib/debug';
import {apply, exec} from '../lib/packages';
import {camelizeObject} from '../lib/util';

/**
 * Execute a command in each package directory. Note: commands with spaces and
 * pipes are supported, but must be wrapped in quotes.
 */
export default class Exec extends Command {
  /**
   * description
   */
  static description = 'Execute a command in each package directory. Note: commands with spaces and pipes are supported, but must be wrapped in quotes.';

  /**
   * flags
   */
  static flags = {
    'fail-fast': flags.boolean({
      description:
        'Fail as soon as a command fails, rather than running all to completion',
    }),
    'package-name': flags.string({
      char: 'p',
      description:
        'The package against which to run this command. May be specified more than once.',
      multiple: true,
    }),
    silent: flags.boolean({
      char: 's',
      description: 'Indicates nothing should be printed to the stdout',
    }),
  };

  /**
   * args
   */
  static args = [
    {
      name: 'command',
      required: true,
    },
  ];

  // TODO determine if we should disable strict mode or simply require commands
  // be wrapped in quotes
  /**
   * Disable strict mode
   */
  static strict = false;

  /**
   * implementation
   */
  async run() {
    const {flags, args, argv} = this.parse(Exec);

    const options = {
      ...camelizeObject(flags),
      ...camelizeObject(args),
    } as apply.InvocationOptions;

    const command = argv.join(' ');

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
}
