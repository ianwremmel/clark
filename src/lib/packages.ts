import {sync as glob} from 'glob';
import {dirname} from 'path';

export namespace packages {
  const cwd = 'packages/node_modules';

  export async function list() {
    const directories = glob('**/package.json', {cwd});
    return directories.map(dirname);
  }
}
