import {execSync} from 'child_process';
import {readFile as fsReadFile} from 'mz/fs';
import {resolve as pathResolve} from 'path';

/**
 * Run a command in the fixture directory.
 */
export default async function run(
  cmd: string,
  fixture: string = 'monorepo',
): Promise<string> {
  const startDir = process.cwd();
  process.chdir(rootDir(fixture));

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

/**
 * Reads a file in the specified fixture directory
 * @param filename
 * @param fixture
 */
export async function readFile(
  filename: string,
  fixture: string = 'monorepo',
): Promise<string> {
  const fullFileName = pathResolve(rootDir(fixture), filename);
  return await fsReadFile(fullFileName, 'utf-8');
}

/**
 * Finds the root directory for the specified fixture monorepo
 * @param fixture
 */
export function rootDir(fixture: string = 'monorepo') {
  return pathResolve(__dirname, '..', 'fixtures', fixture);
}
