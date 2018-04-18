import {readFile as fsReadFile} from 'mz/fs';
import {resolve as pathResolve} from 'path';

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
  return fsReadFile(fullFileName, 'utf-8');
}

/**
 * Finds the root directory for the specified fixture monorepo
 * @param fixture
 */
export function rootDir(fixture: string = 'monorepo') {
  return pathResolve(__dirname, '..', 'fixtures', fixture);
}
