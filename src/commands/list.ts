import {Command} from '@oclif/command';

import {list} from '../lib/packages';

/**
 * List all packages
 */
export default class List extends Command {
  /**
   * description
   */
  static description = 'List all packages';

  /**
   * implementation
   */
  async run() {
    for (const packageName of await list()) {
      console.log(packageName);
    }
  }
}
