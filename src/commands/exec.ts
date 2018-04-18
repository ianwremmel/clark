import {Command, flags} from '@oclif/command';

import {format as f} from '../lib/debug';
import {apply, exec} from '../lib/packages';

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
    failFast: flags.boolean({
      description:
        'Fail as soon as a command fails, rather than running all to completion',
    }),
    'fail-fast': flags.boolean({
      description: 'Alias of --failFast',
    }),
    packageName: flags.string({
      char: 'p',
      description:
        'The package against which to run this command. May be specified more than once.',
      multiple: true,
    }),
    package: flags.string({
      description: 'alias of --packageName',
      multiple: true,
    }),
    'package-name': flags.string({
      description: 'alias of --packageName',
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

  /**
   * implementation
   */
  async run() {
    const {args, argv, flags} = this.parse(Exec);

    flags.packageName = ([] as string[])
      .concat(flags.packageName)
      .concat(flags['package-name'])
      .concat(flags.package)
      .filter(Boolean);

    if (!flags.packageName.length) {
      delete flags.packageName;
    }

    flags.failFast = flags.failFast || flags['fail-fast'];

    const options = {
      ...flags,
      ...args,
    };

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
