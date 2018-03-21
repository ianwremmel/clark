import {CommandModule} from 'yargs';
import {packages} from '../lib/packages';

const ExecCommand: CommandModule = {
  describe: 'List all packages',

  async handler() {
    for (const pkg of await packages.list()) {
      console.log(pkg);
    }
  },
};

export = ExecCommand;
