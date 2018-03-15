import {execSync} from 'child_process';
import {resolve as pathResolve} from 'path';
import yargs from 'yargs';

/**
 * Run a command in the fixture directory.
 * @param {string} cmd
 * @return {string}
 */
export default function run(cmd) {
  process.chdir(pathResolve(__dirname, '..', 'fixtures', 'monorepo'));

  // reminder: this path is relative to the fixture directory
  const toExec = `ts-node ${pathResolve(__dirname, '../../../src/cli.ts')} ${cmd}`;

  // pass {stdio: 'pipe'} to prevent error output from being printed in the test
  // report.
  return Promise.resolve(execSync(toExec, {stdio: 'pipe'})
    .toString()
    .trim());
}
