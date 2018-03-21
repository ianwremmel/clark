import {CommandModule} from 'yargs';
import {list} from '../lib/packages';

const ExecCommand: CommandModule = {
  describe: 'List all packages',

  async handler() {
    for (const packageName of await list()) {
      console.log(packageName);
    }
  },
};

export = ExecCommand;
