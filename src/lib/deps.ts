import {existsSync, readFileSync} from 'fs';
import {dirname, join, resolve} from 'path';

import {format as f, makeDebug} from './debug';
import detective from './detective';
import {findEntryPoints, getPackagePath, read, write} from './packages';
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
 * @param packageName - needed so we can determine how to update local file:
 * paths
 */
async function addVersionsToDeps(
  deps: string[],
  packageName: string,
): Promise<VersionedDependencies> {
  const proj = await readProject();
  const descender = join(
    ...new Array((await getPackagePath(packageName)).split('/').length).fill(
      '..',
    ),
  );

  debug(f`Adding versions for ${packageName} dependencies`);
  return deps.reduce((acc, dep) => {
    let version = proj.dependencies[dep];
    debug(f`found ${version} for ${dep}`);
    if (version.startsWith('file:')) {
      debug(
        f`${version} is a local path. making it relative to ${packageName}`,
      );
      const relPath = version.replace(/^file:\/*/, '');
      const newVersion = `file:${join(descender, relPath)}`;
      debug(f`replacing ${version} with ${newVersion}`);
      version = newVersion;
    }

    acc[dep] = version;
    return acc;
  }, {} as VersionedDependencies);
}

/**
 * Strips path segments off of require statements
 */
function convertRequiresToDeps(requires: string[]): string[] {
  requires = [...new Set(requires)]
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
      requires.reduce((acc, req) => {
        debug(f`Found ${req}`);
        if (req.startsWith('.')) {
          debug(f`${req} is relative, descending`);
          const next = findRequires(resolve(dirname(filePath), req));
          return [...new Set([...acc, ...next])];
        }
        return acc;
      }, [] as string[]),
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
 */
export async function generate(packageName: string) {
  const deps = await list(packageName);

  const versionedDeps = await addVersionsToDeps(deps, packageName);

  const pkg = await read(packageName);
  pkg.dependencies = versionedDeps;
  await write(packageName, pkg);
}

/**
 * Lists dependencies for the specified package
 */
export async function list(packageName: string): Promise<string[]> {
  const entrypoints = await findEntryPoints(packageName);

  const requires = entrypoints.reduce((acc, entrypoint) => {
    return acc.concat(findRequires(entrypoint));
  }, [] as string[]);

  return convertRequiresToDeps(requires).sort();
}

/**
 * Loads a source file
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
