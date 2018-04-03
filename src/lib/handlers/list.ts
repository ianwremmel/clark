import {list} from '../packages';

export namespace List {
  export async function handler(options: Options): Promise<void> {
    for (const packageName of await list()) {
      console.log(packageName);
    }
  }

  export interface Options {}
}
