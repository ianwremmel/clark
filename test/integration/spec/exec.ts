import {test} from '@oclif/test';
import {assert} from 'chai';
import {resolve} from 'path';

/**
 * helper
 * @param str
 */
function stringToObject(str: string) {
  return str
    .split('\n')
    .map((row) => row.split('='))
    .reduce<{[key: string]: string}>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}

describe('exec', () => {
  test
    .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
    .stdout()
    .stderr()
    .command(['exec', '--silent', 'pwd'])
    .it('executes a command in every directory', async (ctx) => {
      assert.equal(
        ctx.stdout,
        `${[
          '@example/scoped-package-the-first',
          '@example/scoped-package-the-second',
          'not-scoped',
        ]
          .map((dir) =>
            resolve(
              __dirname,
              '../fixtures/monorepo/packages/node_modules',
              dir,
            ),
          )
          .join('\n\n')}\n\n`,
      );
    });

  test
    .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
    .stdout()
    .stderr()
    .command(['exec', '--silent'])
    .catch((err) => {
      assert.include(err.message, 'Missing 1 required arg:');
    })
    .it('requires a command argument');

  test
    .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
    .stdout()
    .stderr()
    .command(['exec', '--silent', 'ls | wc -l'])
    .it('supports commands with pipes', async (ctx) => {
      assert.match(ctx.stdout, /\s*2\n\s*2\n\s*3/g);
    });

  test
    .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
    .stdout()
    .stderr()
    .command(['exec', '--silent', 'ls -a'])
    .it('supports commands with spaces', async (ctx) => {
      assert.equal(
        ctx.stdout,
        '.\n..\ndist\npackage.json\n\n.\n..\ndist\npackage.json\n\n.\n..\ndist\npackage.json\ntest\n\n',
      );
    });

  test
    .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
    .stdout()
    .stderr()
    .command([
      'exec',
      '--silent',
      '--package-name',
      '@example/scoped-package-the-first',
      'env | grep CLARK | grep -v CLARK_ENV',
    ])
    .it('injects useful environment variables', async (ctx) => {
      // strip out this project's path so we can write consistent assertions
      // different versions of node unexpectedly impact the order of the results,
      // so we need to do an object comparison instead of a string comparison.
      const modified = stringToObject(
        ctx.stdout.replace(
          new RegExp(resolve(__dirname, '..', '..'), 'g'),
          'REPLACED',
        ),
      );

      // This might just be a weird environment thing on my computer, but
      // somehow, modified was ending up with an entry like {'': undefined}
      delete modified[''];

      assert.deepEqual(modified, {
        CLARK_ROOT_PATH: 'REPLACED/integration/fixtures/monorepo',
        CLARK_PACKAGE_REL_PATH:
          'packages/node_modules/@example/scoped-package-the-first',
        CLARK_PACKAGE_ABS_PATH:
          'REPLACED/integration/fixtures/monorepo/packages/node_modules/@example/scoped-package-the-first',
        CLARK_PACKAGE_NAME: '@example/scoped-package-the-first',
      });
    });

  describe('with --package', () => {
    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command(['exec', '--silent', '--package-name', 'not-scoped', 'pwd'])
      .it(
        'executes a comand in the specified package directory',
        async (ctx) => {
          assert.equal(
            ctx.stdout,
            `${['not-scoped']
              .map((dir) =>
                resolve(
                  __dirname,
                  '../fixtures/monorepo/packages/node_modules',
                  dir,
                ),
              )
              .join('\n')}\n\n`,
          );
        },
      );

    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command([
        'exec',
        '--silent',
        '--package-name',
        '@example/scoped-package-the-first',
        '--package-name',
        '@example/scoped-package-the-second',
        'pwd',
      ])
      .it(
        'executes a command in each specified package directory',
        async (ctx) => {
          assert.equal(
            ctx.stdout,
            `${[
              '@example/scoped-package-the-first',
              '@example/scoped-package-the-second',
            ]
              .map((dir) =>
                resolve(
                  __dirname,
                  '../fixtures/monorepo/packages/node_modules',
                  dir,
                ),
              )
              .join('\n\n')}\n\n`,
          );
        },
      );

    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command([
        'exec',
        '--fail-fast',
        '--silent',
        '--package-name',
        'not-a-package',
        'pwd',
      ])
      .catch((err) => {
        assert.include(
          err.message,
          '"not-a-package" does not appear to identify a package',
        );
      })
      .it('fails if the package does not exist');
  });
});
