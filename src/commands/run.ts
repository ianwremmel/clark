import {Command, flags} from '@oclif/command';

import {load} from '../lib/config';
import {format as f} from '../lib/debug';
import {apply, execScript} from '../lib/packages';
import {camelizeObject} from '../lib/util';

export default class Run extends Command {
  static description = 'Runs a script in each package directory. This is different from `exec` in that scripts should be defined in .clarkrc and may be overridden on a per-package basis via npm scripts. npm scripts defined only in subpackage package.jsons can be run this way, but only scripts named in .clarkrc will populate the help output.';

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

  static args = [{name: 'script', required: true}];

  static strict = false;

  async run() {
    const {flags, args, argv} = this.parse(Run);

    const options = {
      ...camelizeObject(flags),
      ...camelizeObject(args),
    } as apply.InvocationOptions;

    const script = options.script;
    const extra = argv.join(' ').replace(script, '');

    const config = load();
    const fallbackScript = config.scripts[script];

    // console.log('options:', options);
    // console.log('scriptName:', script);
    // console.log('extra:', extra);

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
