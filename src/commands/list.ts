import {Command} from '@oclif/command';

import {list} from '../lib/packages';

export default class List extends Command {
  static description = 'List all packages';

  async run() {
    for (const packageName of await list()) {
      console.log(packageName);
    }
  }
}
