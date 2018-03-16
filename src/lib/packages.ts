import * as debugFactory from "debug";

import { sync as glob } from "glob";
import { dirname, resolve } from "path";
import spawn from "./spawn";

const debug = debugFactory("clark:lib:packages");

export namespace packages {
  const cwd = "packages/node_modules";

  export async function list(): Promise<string[]> {
    debug("listing all packages");
    const directories = glob("**/package.json", { cwd });
    debug(`found "${directories.length}" packages`);
    return directories.map(dirname);
  }

  export async function isPackage(packageName: string): Promise<boolean> {
    debug(`checking if "${packageName}" identifies a package`);
    const directories = glob(packageName + "/" + "package.json", { cwd });
    switch (directories.length) {
      case 0:
        debug(`"${packageName}" does not identify a package`);
        return false;
      case 1:
        debug(`"${packageName}" identifies a package`);
        return true;
      default:
        throw new Error(
          `"${packageName}" appears to represent multiple packages`
        );
    }
  }

  export async function exec(cmd: string, packageName: string): Promise<void> {
    if (!await isPackage(packageName)) {
      throw new Error(`"${packageName}" does not appear to identify a package`);
    }

    debug(`running command "${cmd}" in directory for package "${packageName}"`);
    const bin = "bash";
    const args = ["-c", cmd];
    try {
      const result = await spawn(bin, args, { cwd: resolve(cwd, packageName) });
      debug(`ran command "${cmd}" in directory for package "${packageName}"`);
      return result;
    } catch (err) {
      debug(`command "${cmd}" failed for package "${packageName}"`);
      throw err;
    }
  }
}
