import findRoot from 'find-root';
import {existsSync} from 'fs';
import {resolve} from 'path';

/**
 * Locates the monorepo's root based on various heuristics including existence
 * of .clarkrc, package.json, and .git paths.
 */
export async function findProjectRoot(): Promise<string> {
  return findRoot(process.cwd(), (dir: string) => {
    if (!existsSync(resolve(dir, 'package.json'))) {
      return false;
    }

    if (existsSync(resolve(dir, '.clarkrc'))) {
      return true;
    }

    if (existsSync(resolve(dir, '.git'))) {
      return true;
    }

    return false;
  });
}

/**
 * Indicates if this project has a .clarkrc file
 * @param rootDir
 */
export async function hasRc(rootDir: string): Promise<boolean> {
  return existsSync(resolve(rootDir, '.clarkrc'));
}
