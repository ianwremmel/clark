import * as debugFactory from 'debug';
import {exec, list} from '../packages';

const debug = debugFactory('clark:lib:handlers:exec');

export namespace Exec {
  async function run(command: string, packageName: string): Promise<void> {
    debug(`Running "${command}" against specified package "${packageName}"`);
    await exec(command, packageName);
    debug(`Ran "${command}" against specified package "${packageName}"`);
    return;
  }

  export async function handler(options: Options): Promise<void> {
    const {packageName, command} = options;

    if (packageName) {
      if (Array.isArray(packageName)) {
        debug(
          `Running "${command}" against specified packages "${packageName.join(
            ', ',
          )}"`,
        );
        for (const _packageName of packageName) {
          await run(command, _packageName);
        }
        debug(
          `Ran "${command}" against specified packages "${packageName.join(
            ', ',
          )}"`,
        );
        return;
      } else {
        await run(command, packageName);
        return;
      }
    }

    debug(`Running "${command}" against each package`);
    for (const _packageName of await list()) {
      await run(command, _packageName);
    }
    debug(`Ran "${command}" against each package`);
  }

  export interface Options {
    packageName?: string | string[];
    command: string;
  }
}
