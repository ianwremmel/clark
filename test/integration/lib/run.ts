import {execSync} from 'child_process';
import {resolve as pathResolve} from 'path';
import {start} from 'repl';
import yargs from 'yargs';

/**
 * Run a command in the fixture directory.
 */
export default async function run(cmd: string): Promise<string> {
  const startDir = process.cwd();
  process.chdir(pathResolve(__dirname, '..', 'fixtures', 'monorepo'));

  // reminder: this path is relative to the fixture directory
  const toExec = `ts-node ${pathResolve(
    __dirname,
    '../../../src/cli.ts',
  )} ${cmd}`;

  try {
    // pass {stdio: 'pipe'} to prevent error output from being printed in the test
    // report.
    const result = execSync(toExec, {stdio: 'pipe'})
      .toString()
      .trim();
    return result;
  } finally {
    process.chdir(startDir);
  }
}
