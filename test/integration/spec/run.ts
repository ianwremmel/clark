import {test} from '@oclif/test';
import {assert} from 'chai';
import {resolve} from 'path';

describe('run', () => {
  test
    .skip()
    .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
    .stdout()
    .stderr()
    .command(['run', '--help'])
    .it('generates commands from the local .clarkrc', async (ctx) => {
      assert.include(ctx.stdout, 'local');
      assert.include(ctx.stdout, 'override');
    });

  test
    .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
    .stdout()
    .stderr()
    .command(['run', 'local', '--silent'])
    .it('executes a script in each package directory', async (ctx) => {
      assert.equal(ctx.stdout, 'run\n\nrun\n\nrun\n\n');
    });

  describe('when a package has an npm script of the same name', () => {
    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command(['run', 'override', '--silent'])
      .it(
        'executes the override or falls back to the .clarkrc version',
        async (ctx) => {
          assert.equal(
            ctx.stdout,
            'not overridden\n\nnot overridden\n\nthis is an override\n\n',
          );
        },
      );
  });

  describe('when invoked with --package', () => {
    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command(['run', 'override', '--silent', '--package-name', 'not-scoped'])
      .it('invokes within only that package', async (ctx) => {
        assert.equal(ctx.stdout, 'this is an override\n\n');
      });
  });

  describe('when invoked with --package twice', () => {
    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command([
        'run',
        'override',
        '--silent',
        '--package-name',
        'not-scoped',
        '--package-name',
        '@example/scoped-package-the-first',
      ])
      .it('invokes within only those packages', async (ctx) => {
        assert.equal(ctx.stdout, 'not overridden\n\nthis is an override\n\n');
      });
  });

  test
    .do(() =>
      process.chdir(resolve(__dirname, '../fixtures/monorepo/packages')),
    )
    .stdout()
    .stderr()
    .command(['run', 'override', '--silent'])
    .it('can be run from anywhere in the repo', async (ctx) => {
      assert.equal(
        ctx.stdout,
        'not overridden\n\nnot overridden\n\nthis is an override\n\n',
      );
    });

  describe('when run from within a package directory', () => {
    test
      .do(() =>
        process.chdir(
          resolve(
            __dirname,
            '../fixtures/monorepo/packages/node_modules/not-scoped',
          ),
        ),
      )
      .stdout()
      .stderr()
      .command(['run', 'override', '--silent'])
      .it('infers the package name from the directory', async (ctx) => {
        assert.equal(ctx.stdout, 'this is an override\n\n');
      });

    test
      .do(() =>
        process.chdir(
          resolve(
            __dirname,
            '../fixtures/monorepo/packages/node_modules/not-scoped',
          ),
        ),
      )
      .stdout()
      .stderr()
      .command([
        'run',
        'override',
        '--silent',
        '--package-name',
        '@example/scoped-package-the-first',
      ])
      .it('prefers the packages switch to inferrence', async (ctx) => {
        assert.equal(ctx.stdout, 'not overridden\n\n');
      });
  });

  describe('when invoked with a script not in .clarkrc', () => {
    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command(['run', '--silent', 'not-in-clarkrc'])
      .it('runs that script in any package that defines it', async (ctx) => {
        assert.equal(ctx.stdout, '1\n\n2\n\n');
      });

    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command([
        'run',
        '--silent',
        '--package-name',
        '@example/scoped-package-the-first',
        'not-in-clarkrc',
      ])
      .it('supports --package', async (ctx) => {
        assert.equal(ctx.stdout, '1\n\n');
      });
  });
});
