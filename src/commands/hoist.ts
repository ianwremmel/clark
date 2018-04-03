import {CommandModule} from 'yargs';
import {Hoist} from '../lib/handlers/hoist';

const HoistCommand: CommandModule = {
  command: 'hoist',

  describe:
    'Migrate dependencies and dev dependencies from a sub package to the root package.json',

  builder(yargs) {
    return yargs
      .option('package-name', {
        alias: ['p', 'package'],
        describe:
          'The package against which to run this command. May be specified more than once.',
        type: 'string',
      })
      .option('risky', {
        default: false,
        describe:
          'Indicates if clark should attempt to reconcile semver mismatches.',
        type: 'boolean',
      })
      .strict();
  },

  handler: Hoist.handler,
};

export = HoistCommand;
