import {
  ChildProcess,
  spawn as cpSpawn,
  SpawnOptions as cpSpawnOptions
} from "child_process";

import * as invariant from "invariant";

export interface SpawnOptions extends cpSpawnOptions {
  /**
   * When true, unrefs the ChildProcess.
   */
  detached?: boolean;
  /**
   * populated when SpawnOtions.detached is true. Gives you a handle to the
   * ChildProcess
   */
  child?: ChildProcess;
}

export class SpawnError extends Error {
  /**
   * exit code of the ChildProcess
   */
  code: number = 0;

  /**
   * stderr output of the ChildProcess
   */
  data: string = "";
}
/**
 * Simplified spawn
 */
export function spawn(
  cmd: string,
  args: string[] = [],
  options: SpawnOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    invariant(cmd, '"cmd" is required');
    invariant(Array.isArray(args), '"args" is required and must be an Array');

    const opts = Object.assign(
      {
        detached: false,
        stdio: "inherit"
      },
      options
    );
    const child = cpSpawn(cmd, args, opts);

    let data = "";
    if (child.stderr) {
      child.stderr.on("data", d => {
        data += d;
      });
    }

    child.on("close", code => {
      if (code) {
        const e = new SpawnError(`${cmd} exited with code "${code}"`);
        e.code = code;
        e.data = data;

        return reject(e);
      }

      return resolve();
    });

    if (options && options.detached) {
      child.unref();
      /* eslint no-param-reassign: [0] */
      options.child = child;
    }
  });
}
