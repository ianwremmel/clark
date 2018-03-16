import {execSync} from 'child_process';
import {resolve as pathResolve} from 'path';
import yargs from 'yargs';

/**
 * Run a command in the fixture directory.
 */
export default function run(cmd: string): Promise<string> {
  return new Promise((resolve) => {
    process.chdir(pathResolve(__dirname, '..', 'fixtures', 'monorepo'));

    // reminder: this path is relative to the fixture directory
    const toExec = `ts-node ${pathResolve(__dirname, '../../../src/cli.ts')} ${cmd}`;

    // pass {stdio: 'pipe'} to prevent error output from being printed in the test
    // report.
    resolve(
      execSync(toExec, {stdio: 'pipe'})
        .toString()
        .trim()
    );
  });
}
