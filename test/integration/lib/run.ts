import {resolve as pathResolve} from 'path';

import {readFile as fsReadFile} from 'mz/fs';

/**
 * Reads a file in the specified fixture directory
 */
export async function readFile(
  filename: string,
  fixture = 'monorepo',
): Promise<string> {
  const fullFileName = pathResolve(rootDir(fixture), filename);
  return fsReadFile(fullFileName, 'utf-8');
}

/**
 * Finds the root directory for the specified fixture monorepo
 */
export function rootDir(fixture = 'monorepo') {
  return pathResolve(__dirname, '..', 'fixtures', fixture);
}
