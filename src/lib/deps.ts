import {existsSync, readFileSync} from 'fs';
import {dirname, resolve} from 'path';

import {format as f, makeDebug} from './debug';
import detective from './detective';
import {findEntryPoints, read, write} from './packages';
import {read as readProject} from './project';

const debug = makeDebug(__filename);

const extensions = ['js', 'jsx', 'ts', 'tsx', 'mjs'];

const visited = new Map();

interface VersionedDependencies {
  [key: string]: string;
}

/**
 * Adds version strings from the root package.json to the passed in set of
 * dependencies.s
 * @param deps
 */
async function addVersionsToDeps(
  deps: string[],
): Promise<VersionedDependencies> {
  const proj = await readProject();
  return deps.reduce(
    (acc, dep) => {
      acc[dep] = proj.dependencies[dep];
      return acc;
    },
    {} as VersionedDependencies,
  );
}

/**
 * Strips path segments off of require statements
 * @param requires
 */
function convertRequiresToDeps(requires: string[]): string[] {
  requires = Array.from(new Set(requires))
    .filter((r) => !r.startsWith('.'))
    .map((r) => {
      // The following block makes sure the dep is a package name and not a file
      // reference. Given a require of `@scope/foo/bar/baz`, the following will
      // return `@scope/foo`. Given a require of `foo/bar/baz`, the folling will
      // return `foo`.
      const rr = r.split('/');
      if (rr[0].startsWith('@')) {
        return rr.slice(0, 2).join('/');
      }
      return rr[0];
    });
  return requires;
}

/**
 * Finds all of the require/import statements for specified file *and its local
 * dependencies*
 * @param filePath
 */
function findRequires(filePath: string): string[] {
  if (visited.has(filePath)) {
    debug(f`Already visited ${filePath}`);
    return visited.get(filePath);
  }

  try {
    debug(f`Finding requires for ${filePath}`);
    const requires = detective(loadSource(filePath));
    debug(f`Found ${requires.length} requires for ${filePath}`);

    visited.set(filePath, []);

    visited.set(
      filePath,
      requires.reduce(
        (acc, req) => {
          debug(f`Found ${req}`);
          if (req.startsWith('.')) {
            debug(f`${req} is relative, descending`);
            const next = findRequires(resolve(dirname(filePath), req));
            return Array.from(new Set([...acc, ...next]));
          }
          return acc;
        },
        [] as string[],
      ),
    );

    return requires;
  } catch (err) {
    if (err.code === 'EISDIR') {
      debug(f`${filePath} is a directory, descending`);
      return findRequires(resolve(filePath, 'index'));
    }

    debug(f`An unexpected error occurred while walking ${filePath}`);
    throw err;
  }
}

/**
 * Generate dependencies for the specified package by walking the code found at
 * its entrypoints.
 * @param packageName
 */
export async function generate(packageName: string) {
  const deps = await list(packageName);

  const versionedDeps = await addVersionsToDeps(deps);

  const pkg = await read(packageName);
  pkg.dependencies = versionedDeps;
  await write(packageName, pkg);
}

/**
 * Lists dependencies for the specified package
 * @param packageName
 */
export async function list(packageName: string): Promise<string[]> {
  const entrypoints = await findEntryPoints(packageName);

  const requires = entrypoints.reduce(
    (acc, entrypoint) => {
      return acc.concat(findRequires(entrypoint));
    },
    [] as string[],
  );

  return convertRequiresToDeps(requires).sort();
}

/**
 * Loads a source file
 * @param filePath
 */
function loadSource(filePath: string): string {
  if (!existsSync(filePath)) {
    for (const ext of extensions) {
      const withExt = `${filePath}.${ext}`;
      if (existsSync(withExt)) {
        return loadSource(withExt);
      }
    }

    debug(f`Could not find node module identified by ${filePath}`);
    throw new Error(`Could not find node module identified by ${filePath}`);
  }

  return readFileSync(filePath, 'utf-8');
}