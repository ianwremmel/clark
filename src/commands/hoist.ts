import {Command, flags} from '@oclif/command';

import {format as f} from '../lib/debug';
import {apply, hoist} from '../lib/packages';

/**
 * Migrate dependencies and dev dependencies from a sub package to the root
 * package.json
 */
export default class Hoist extends Command {
  /**
   * description
   */
  static description = 'Migrate dependencies and dev dependencies from a sub package to the root package.json';

  /**
   * flags
   */
  static flags = {
    failFast: flags.boolean({
      description:
        'Fail upon encountering a package that cannot be hoisted, rather than running all to completion',
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
    risky: flags.boolean({
      description:
        'Indicates if clark should attempt to reconcile semver mismatches.',
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
    const {args, flags} = this.parse(Hoist);

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
      ...args,
      ...flags,
    };

    await apply(
      {
        before: (packages) => {
          console.log(packages);
          return f`Hoisting ${packages.length} packages`;
        },
        beforeEach: (packageName) => f`Hoisting deps from ${packageName}`,
        afterEach: (packageName, error) => {
          if (error) {
            return f`Failed to hoist deps from ${packageName}`;
          }
          return f`Hoisted deps from ${packageName}`;
        },
        after: (packages, errors) => {
          if (errors.length) {
            return `Failed to hoist deps in ${errors.length} packages`;
          }
          return f`Hoisted ${packages.length} packages`;
        },
      },
      async (packageName: string) => {
        return hoist(packageName, options);
      },
      options,
    );
  }
}
