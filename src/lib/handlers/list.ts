import {list} from '../packages';

/**
 * Contains the handler for the list command
 */
export namespace List {
  /**
   * Implementation of the list command
   * @param options
   */
  export async function handler(): Promise<void> {
    for (const packageName of await list()) {
      console.log(packageName);
    }
  }
}
