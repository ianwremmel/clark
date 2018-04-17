import {
  ChildProcess,
  spawn as cpSpawn,
  SpawnOptions as cpSpawnOptions,
} from 'child_process';
import invariant from 'invariant';

import {format as f, makeDebug} from '../lib/debug';

const debug = makeDebug(__filename);

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

    debug(f`Running ${cmd} ${args.join(' ')}`);

    const opts = {
      detached: false,
      stdio: process.env.NODE_ENV === 'test' ? undefined : 'inherit',
      ...options,
    };
    const child = cpSpawn(cmd, args, opts);

    let stderr = '';
    if (child.stderr) {
      child.stderr.on('data', (d) => {
        stderr += d;
      });
    }

    let stdout = '';
    if (child.stdout) {
      child.stdout.on('data', (d) => {
        stdout += d;
      });
    }

    child.on('close', (code) => {
      // the oclif test helpers don't propagate inherited stdio, so we need to
      // fake it for test purposes :(
      if (process.env.NODE_ENV === 'test') {
        console.log(stdout);
        console.error(stderr);
      }

      debug(f`Ran ${cmd} ${args.join(' ')}`);

      if (code) {
        const e = new spawn.ExitError(`${cmd} exited with code "${code}"`);
        e.code = code;
        e.data = stderr;

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
