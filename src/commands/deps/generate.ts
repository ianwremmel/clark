import {Command, flags} from '@oclif/command';

import {format as f} from '../../lib/debug';
import {generate} from '../../lib/deps';
import {apply} from '../../lib/packages';

/**
 * Walk the dependency tree and copy deps from the root package.json to each
 * subpackage as appropriate
 */
export default class DepsGenerate extends Command {
  /**
   * aliases
   */
  static aliases = ['deps:generate'];

  /**
   * description
   */
  static description = 'Generate package depencies';

  /**
   * flags
   */
  static flags = {
    failFast: flags.boolean({
      description: 'Stop on first failure',
    }),
    'fail-fast': flags.boolean({
      description: 'Alias of --failFast',
    }),
    packageName: flags.string({
      char: 'p',
      description:
        'The package for which to generate dependencies. May be specified more than once',
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
   * implementation
   */
  async run() {
    const {flags, args} = this.parse(DepsGenerate);

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

    await apply(
      {
        before: (packages) =>
          f`Generating dependencies for ${packages.length} packages`,
        beforeEach: (packageName) =>
          f`Generating dependencies for ${packageName}`,
        afterEach: (packageName, error) => {
          if (error) {
            return f`Failed to generate deps for ${packageName}`;
          }

          return f`Generated deps for ${packageName}`;
        },
        after: (packages, errors) => {
          if (errors.length) {
            return f`Failed to generate deps for ${errors.length} packages`;
          }

          return f`Generated dependencies for ${packages.length} packages`;
        },
      },
      generate,
      options,
    );
  }
}
