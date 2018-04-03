import {CommandModule} from 'yargs';
import {List} from '../lib/handlers/list';

const ExecCommand: CommandModule = {
  describe: 'List all packages',

  builder(yargs) {
    return yargs.strict();
  },

  handler: List.handler,
};

export = ExecCommand;
