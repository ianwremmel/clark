import {Command, flags} from '@oclif/command';

import {load} from '../lib/config';
import {format as f} from '../lib/debug';
import {apply, execScript} from '../lib/packages';

/**
 * Runs a script in each package directory. This is different from `exec` in
 * that scripts should be defined in .clarkrc and may be overridden on a
 * per-package basis via npm scripts. npm scripts defined only in subpackage
 * package.jsons can be run this way, but only scripts named in .clarkrc will
 * populate the help output.
 */
export default class Run extends Command {
  /**
   * description
   */
  static description = 'Runs a script in each package directory. This is different from `exec` in that scripts should be defined in .clarkrc and may be overridden on a per-package basis via npm scripts. npm scripts defined only in subpackage package.jsons can be run this way, but only scripts named in .clarkrc will populate the help output.';

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
  static args = [{name: 'script', required: true}];

  /**
   * Disable strict mode
   */
  static strict = false;

  /**
   * implementation
   */
  async run() {
    const {args, flags} = this.parse(Run);
    // saving this for a future feature
    // const {flags, args, argv} = this.parse(Run);

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

    const script = options.script;
    // saving this for a future feature
    // const extra = argv.join(' ').replace(script, '');

    const config = load();
    const fallbackScript = config.scripts && config.scripts[script];

    await apply(
      {
        before: (packages) =>
          f`Running ${script} against ${packages.length} packages`,
        beforeEach: (packageName) =>
          f`Running ${script} against ${packageName}`,
        afterEach: (packageName, error) => {
          if (error) {
            return `${script} failed against ${packageName}`;
          }
          return `Ran ${script} against ${packageName}`;
        },
        after: (packages, errors) => {
          if (errors.length) {
            return f`clark run failed to execute the following command against ${
              errors.length
            } packages\n> ${script}\n`;
          }

          return `Ran ${script} successfully against ${packages.length}`;
        },
      },
      async (packageName) => {
        await execScript(script, packageName, fallbackScript);
      },
      options,
    );
  }
}
