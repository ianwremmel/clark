import findRoot from 'find-root';
import {existsSync} from 'fs';
import {readFile, writeFile} from 'mz/fs';
import {resolve} from 'path';
import {format as f, makeDebug} from './debug';

const debug = makeDebug(__dirname);

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
  debug(f`checking if ${rootDir} contains '.clarkrc'`);
  const contains = existsSync(resolve(rootDir, '.clarkrc'));
  debug(f`${rootDir} ${contains ? 'contains' : 'does not contain'} '.clarkrc'`);
  return contains;
}

/**
 * Determines whether the given paths describe an alle monorepo by checking for
 * a packages/node_modules path in all of them.
 * @param paths
 */
export function isAlleRepo(paths: string[]): boolean {
  return paths.every(packagePath =>
    packagePath.includes('packages/node_modules'),
  );
}

/**
 * Reads the monorepo's package.json
 */
export async function read() {
  debug('Reading root package.json');
  const root = JSON.parse(await readFile('package.json', 'utf-8'));
  debug('Read root');
  return root;
}

/**
 * Writes the monorepo's package.json
 */
export async function write(pkg: object) {
  debug('Writing root package.json');
  await writeFile('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
  debug('Wrote root package.json');
  return;
}
