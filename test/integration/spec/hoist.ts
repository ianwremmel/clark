import {assert} from 'chai';
import {execSync} from 'child_process';
import {sync as glob} from 'glob';
import run, {readFile, rootDir} from '../lib/run';

describe('hoist', () => {
  afterEach('checkout', async () => {
    console.log(
      execSync(
        'git checkout ./test/integration/fixtures/unhoisted-monorepo',
      ).toString(),
    );

    console.log(
      execSync(
        'git checkout ./test/integration/fixtures/conflicted-unhoisted-monorepo',
      ).toString(),
    );
  });

  describe('when --package is specified', () => {
    it('migrates dependencies from the specified package to the root package.json', async () => {
      await run(
        'hoist --package @example/scoped-package-the-first',
        'unhoisted-monorepo',
      );
      const root = JSON.parse(
        await readFile('package.json', 'unhoisted-monorepo'),
      );
      assert.deepEqual(root.dependencies, {
        'external-dep-1': '^0.0.1',
      });

      const pkg = JSON.parse(
        await readFile(
          'packages/node_modules/@example/scoped-package-the-first/package.json',
          'unhoisted-monorepo',
        ),
      );
      assert.notProperty(pkg, 'dependencies');
      assert.notProperty(pkg, 'devDependencies');
    });
  });

  describe('when the monorepo packages have conflicting dependencies', () => {
    it('cowardly refuses to overwrite a semver discrepancy', async () => {
      const err = ((await assert.isRejected(
        run('hoist', 'conflicted-unhoisted-monorepo'),
      )) as any) as Error;

      assert.include(
        err.message,
        'Cowardly refusing to overwrite mismatched semver for "external-dep-1" from "@example/scoped-package-the-second"',
      );

      // TODO err must contain helpful message
      const pkg1 = JSON.parse(
        await readFile(
          'packages/node_modules/@example/scoped-package-the-first/package.json',
          'conflicted-unhoisted-monorepo',
        ),
      );
      assert.notProperty(pkg1, 'dependencies');
      assert.notProperty(pkg1, 'devDependencies');

      const pkg2 = JSON.parse(
        await readFile(
          'packages/node_modules/@example/scoped-package-the-second/package.json',
          'conflicted-unhoisted-monorepo',
        ),
      );

      assert.property(pkg2, 'dependencies');
      assert.deepEqual(pkg2.dependencies, {
        'external-dep-1': '^0.2.0',
      });
      assert.notProperty(pkg2, 'devDependencies');

      const root = JSON.parse(
        await readFile('package.json', 'conflicted-unhoisted-monorepo'),
      );

      assert.deepEqual(root.dependencies, {
        'external-dep-1': '^0.0.1',
      });
    });
  });

  it('migrates all dependencies from their packages to the top-level package.json', async () => {
    await run('hoist', 'unhoisted-monorepo');
    const root = JSON.parse(
      await readFile('package.json', 'unhoisted-monorepo'),
    );
    assert.deepEqual(root.dependencies, {
      'external-dep-1': '^0.0.1',
      'external-dep-2': '^0.2.0',
      'external-dep-3': '^3.0.0',
    });

    const packages = glob('packages/node_modules/**/package.json', {
      cwd: rootDir(),
    });

    for (const pkgJsonPath of packages) {
      const pkg = JSON.parse(await readFile(pkgJsonPath, 'unhoisted-monorepo'));
      assert.notProperty(pkg, 'dependencies');
      assert.notProperty(pkg, 'devDependencies');
    }
  });
});