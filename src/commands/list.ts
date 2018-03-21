import {CommandModule} from 'yargs';
import {list} from '../lib/packages';

const ExecCommand: CommandModule = {
  describe: 'List all packages',

  async handler() {
    for (const pkg of await list()) {
      console.log(pkg);
    }
  },
};

export = ExecCommand;
