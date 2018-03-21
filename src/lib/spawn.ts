import {
  ChildProcess,
  spawn as cpSpawn,
  SpawnOptions as cpSpawnOptions,
} from 'child_process';

import invariant from 'invariant';

/**
 * Simplified spawn
 */
export function spawn(
  cmd: string,
  args: string[] = [],
  options?: spawn.Options,
): Promise<void> {
  return new Promise((resolve, reject) => {
    invariant(cmd, '"cmd" is required');
    invariant(Array.isArray(args), '"args" is required and must be an Array');

    const opts = {
      detached: false,
      stdio: 'inherit',
      ...options,
    };
    const child = cpSpawn(cmd, args, opts);

    let data = '';
    if (child.stderr) {
      child.stderr.on('data', d => {
        data += d;
      });
    }

    child.on('close', code => {
      if (code) {
        const e = new spawn.ExitError(`${cmd} exited with code "${code}"`);
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

export namespace spawn {
  /**
   * Options for spawn()
   */
  export interface Options extends cpSpawnOptions {
    /**
     * Indicates if the ChildProcess should be unref()ed
     */
    detached?: boolean;
    /**
     * {opulated when SpawnOtions.detached is true. Provides a handle to the
     * ChildProcess.
     */
    child?: ChildProcess;
  }

  /**
   * Thrown when a spawned command exits non-zero
   */
  export class ExitError extends Error {
    /**
     * exit code of the ChildProcess
     */
    code: number = 0;

    /**
     * stderr output of the ChildProcess
     */
    data: string = '';
  }
}
