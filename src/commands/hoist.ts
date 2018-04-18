import {Command, flags} from '@oclif/command';

import {format as f} from '../lib/debug';
import {apply, hoist} from '../lib/packages';

export default class Hoist extends Command {
  static description = 'Migrate dependencies and dev dependencies from a sub package to the root package.json';

  static flags = {
    'fail-fast': flags.boolean({
      description:
        'Fail upon encountering a package that cannot be hoisted, rather than running all to completion',
    }),
    'package-name': flags.string({
      char: 'p',
      description:
        'The package against which to run this command. May be specified more than once.',
      multiple: true,
    }),
    risky: flags.boolean({
      description:
        'Indicates if clark should attempt to reconcile semver mismatches.',
    }),
    silent: flags.boolean({
      description: 'Indicates nothing should be printed to the stdout',
    }),
  };

  async run() {
    const {flags} = this.parse(Hoist);

    const options = {
      packageName: flags['package-name'],
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
        return hoist(packageName, {risky: flags.risky});
      },
      options as apply.InvocationOptions,
    );
  }
}
