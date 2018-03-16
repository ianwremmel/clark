import * as debugFactory from 'debug';
import {packages} from '../packages';

const debug = debugFactory('clark:lib:handlers:exec');

export namespace Exec {
  export async function handler(options: Options) {
    debug(`running "${options.command}" in each package directory`);
    for (const packageName of await packages.list()) {
      debug(`running "${options.command}" in "${packageName}"'s directory`);
      packages.exec(options.command, packageName);
      debug(`ran "${options.command}" in "${packageName}"'s directory`);
    }
    debug(`ran "${options.command}" in each package directory`);

  }

  export interface Options {
    command: string
  }
}

