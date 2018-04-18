import {test} from '@oclif/test';
import {assert} from 'chai';
import {execSync} from 'child_process';
import {sync as glob} from 'glob';
import {resolve} from 'path';

import {readFile, rootDir} from '../lib/run';

describe('hoist', () => {
  afterEach('checkout', async () => {
    console.log(
      execSync(
        `git checkout ${resolve(__dirname, '../fixtures/unhoisted-monorepo')}`,
      ).toString(),
    );

    console.log(
      execSync(
        `git checkout ${resolve(
          __dirname,
          '../fixtures/conflicted-unhoisted-monorepo',
        )}`,
      ).toString(),
    );

    console.log(
      execSync(
        `git checkout ${resolve(
          __dirname,
          '../fixtures/unhoisted-non-alle-monorepo',
        )}`,
      ).toString(),
    );
  });

  describe('when --package is specified', () => {
    test
      .do(() =>
        process.chdir(resolve(__dirname, '../fixtures/unhoisted-monorepo')),
      )
      .stdout()
      .stderr()
      .command([
        'hoist',
        '--silent',
        '--package-name',
        '@example/scoped-package-the-first',
      ])
      .it(
        'migrates dependencies from the specified package to the root package.json',
        async () => {
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
        },
      );
  });

  describe('when the monorepo packages have conflicting dependencies', () => {
    test
      .do(() =>
        process.chdir(
          resolve(__dirname, '../fixtures/conflicted-unhoisted-monorepo'),
        ),
      )
      .stdout()
      .stderr()
      .command(['hoist', '--silent', '--fail-fast'])
      .catch((err) => {
        assert.include(
          err.message,
          'Cowardly refusing to overwrite "external-dep-1@^1.0.0" for "external-dep-1@^1.1.0" from "@example/scoped-package-the-second"',
        );
      })
      .it('cowardly refuses to overwrite a semver discrepancy', async () => {
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
          'external-dep-1': '^1.1.0',
        });
        assert.notProperty(pkg2, 'devDependencies');
        const root = JSON.parse(
          await readFile('package.json', 'conflicted-unhoisted-monorepo'),
        );
        assert.deepEqual(root.dependencies, {
          'external-dep-1': '^1.0.0',
        });
      });

    describe('when invoked with --risky', () => {
      test
        .do(() =>
          process.chdir(
            resolve(__dirname, '../fixtures/conflicted-unhoisted-monorepo'),
          ),
        )
        .stdout()
        .stderr()
        .command(['hoist', '--silent', '--risky'])
        .it(
          'uses semver comparison to choose a reasonable version',
          async () => {
            const root = JSON.parse(
              await readFile('package.json', 'conflicted-unhoisted-monorepo'),
            );

            assert.deepEqual(root.dependencies, {
              'external-dep-1': '^1.1.0',
            });
          },
        );
    });
  });

  test
    .do(() =>
      process.chdir(resolve(__dirname, '../fixtures/unhoisted-monorepo')),
    )
    .stdout()
    .stderr()
    .command(['hoist', '--silent'])
    .it(
      'migrates all dependencies from their packages to the top-level package.json',
      async () => {
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
          const pkg = JSON.parse(
            await readFile(pkgJsonPath, 'unhoisted-monorepo'),
          );
          assert.notProperty(pkg, 'dependencies');
          assert.notProperty(pkg, 'devDependencies');
        }
      },
    );

  describe('when the monorepo does not follow the alle layout', () => {
    test
      .do(() =>
        process.chdir(
          resolve(__dirname, '../fixtures/unhoisted-non-alle-monorepo'),
        ),
      )
      .stdout()
      .stderr()
      .command(['hoist', '--silent'])
      .it(
        'migrates all dependencies from their packages to the top-level package.json and adds refs to local packages',
        async () => {
          const root = JSON.parse(
            await readFile('package.json', 'unhoisted-non-alle-monorepo'),
          );
          assert.deepEqual(root.dependencies, {
            '@example/scoped-package-the-first':
              'file:./backend/scoped-package-the-first',
            '@example/scoped-package-the-second':
              'file:./backend/scoped-package-the-second',
            'external-dep-1': '^0.0.1',
            'external-dep-2': '^0.2.0',
            'external-dep-3': '^3.0.0',
            'not-scoped': 'file:./frontend/not-scoped',
          });

          const packages = glob('{backend,frontend}/*/package.json', {
            cwd: rootDir(),
          });

          for (const pkgJsonPath of packages) {
            const pkg = JSON.parse(
              await readFile(pkgJsonPath, 'unhoisted-non-alle-monorepo'),
            );
            assert.notProperty(pkg, 'dependencies');
            assert.notProperty(pkg, 'devDependencies');
          }
        },
      );
  });
});
