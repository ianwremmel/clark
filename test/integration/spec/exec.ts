import {assert} from 'chai';
import {resolve} from 'path';
import run from '../lib/run';

function stringToObject(str: string) {
  return str
    .split('\n')
    .map((row) => row.split('='))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}

describe('exec', () => {
  it('executes a command in every directory', async () => {
    const result = await run('clark exec --silent pwd');
    assert.lengthOf(result.split('\n'), 3);
    assert.equal(
      result,
      [
        '@example/scoped-package-the-first',
        '@example/scoped-package-the-second',
        'not-scoped',
      ]
        .map((dir) =>
          resolve(__dirname, '../fixtures/monorepo/packages/node_modules', dir),
        )
        .join('\n'),
    );
  });

  it('requires a command argument', async () => {
    const err = ((await assert.isRejected(
      run('clark exec --silent'),
    )) as any) as Error;
    assert.include(
      err.message,
      'Not enough non-option arguments: got 0, need at least 1',
    );
  });

  it('supports commands with pipes', async () => {
    const result = await run('clark exec --silent "ls | wc -l"');
    assert.match(result, /\s*2\n\s*2\n\s*3/g);
  });

  it('supports commands with spaces', async () => {
    const result = await run('clark exec --silent "ls -a"');
    assert.equal(
      result,
      '.\n..\ndist\npackage.json\n.\n..\ndist\npackage.json\n.\n..\ndist\npackage.json\ntest',
    );
  });

  it('injects useful environment variables', async () => {
    const result = await run(
      'clark exec --silent --package @example/scoped-package-the-first  "env | grep CLARK"',
    );
    // strip out this project's path so we can write consistent assertions
    const modified = result.replace(
      new RegExp(resolve(__dirname, '..', '..'), 'g'),
      'REPLACED',
    );

    // different versions of node unexpectedly impact the order of the results,
    // so we need to do an object comparison instead of a string comparison.

    assert.deepEqual(stringToObject(modified), {
      CLARK_ROOT_PATH: 'REPLACED/integration/fixtures/monorepo',
      CLARK_PACKAGE_REL_PATH:
        'packages/node_modules/@example/scoped-package-the-first',
      CLARK_PACKAGE_ABS_PATH:
        'REPLACED/integration/fixtures/monorepo/packages/node_modules/@example/scoped-package-the-first',
      CLARK_PACKAGE_NAME: '@example/scoped-package-the-first',
    });
  });

  describe('with --package', () => {
    it('executes a comand in the specified package directory', async () => {
      const result = await run(
        'clark exec --silent --package-name not-scoped pwd',
      );
      assert.lengthOf(result.split('\n'), 1);
      assert.equal(
        result,
        ['not-scoped']
          .map((dir) =>
            resolve(
              __dirname,
              '../fixtures/monorepo/packages/node_modules',
              dir,
            ),
          )
          .join('\n'),
      );
    });

    it('executes a command in each specified package directory', async () => {
      const result = await run(
        'clark exec --silent --package-name @example/scoped-package-the-first --package-name @example/scoped-package-the-second pwd',
      );
      assert.lengthOf(result.split('\n'), 2);
      assert.equal(
        result,
        [
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
          .join('\n'),
      );
    });

    it('fails if the package does not exist', async () => {
      const err = ((await assert.isRejected(
        run('clark exec --fail-fast --silent --package-name not-a-package pwd'),
      )) as any) as Error;
      assert.include(
        err.message,
        'Error: "not-a-package" does not appear to identify a package',
      );
    });
  });
});
