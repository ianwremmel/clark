import { spawn as cpSpawn, SpawnOptions } from "child_process";

import * as invariant from "invariant";

/**
 * Simplified spawn
 */
export default function spawn(
  cmd: string,
  args: string[] = [],
  options: SpawnOptions = {}
): Promise<undefined> {
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
        const e = new Error(`${cmd} exited with code "${code}"`);
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
