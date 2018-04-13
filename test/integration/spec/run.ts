import {assert} from 'chai';

import run from '../lib/run';

describe('run', () => {
  it('generates commands from the local .clarkrc', async () => {
    const result = await run('clark run --help');
    assert.include(result, 'local');
    assert.include(result, 'override');
  });

  it('executes a script in each package directory', async () => {
    const result = await run('clark run local --silent');
    assert.equal(result, 'run\nrun\nrun');
  });

  describe('when a package has an npm script of the same name', () => {
    it('executes the override or falls back to the .clarkrc version', async () => {
      const result = await run('clark run override --silent');
      assert.equal(
        result,
        'not overridden\nnot overridden\nthis is an override',
      );
    });
  });

  describe('when invoked with --package', () => {
    it('invokes within only that package', async () => {
      const result = await run(
        'clark run override --silent --package not-scoped',
      );
      assert.equal(result, 'this is an override');
    });
  });

  describe('when invoked with --package twice', () => {
    it('invokes within only those packages', async () => {
      const result = await run(
        'clark run override --silent --package not-scoped --package @example/scoped-package-the-first',
      );
      assert.equal(result, 'not overridden\nthis is an override');
    });
  });

  it('can be run from anywhere in the repo', async () => {
    let result = await run('clark run override --silent', 'monorepo/packages');
    assert.equal(result, 'not overridden\nnot overridden\nthis is an override');

    result = await run(
      'clark run override --silent --package @example/scoped-package-the-first',
      'monorepo/packages/node_modules/not-scoped',
    );
    assert.equal(result, 'not overridden');
  });

  describe('when run from within a package directory', () => {
    it('infers the package name from the directory', async () => {
      const result = await run(
        'clark run override --silent',
        'monorepo/packages/node_modules/not-scoped',
      );
      assert.equal(result, 'this is an override');
    });
  });

  describe('when invoked with a script not in .clarkrc', () => {
    it('runs that script in any package that defines it', async () => {
      const result = await run('clark run --silent not-in-clarkrc');
      assert.equal(result, '1\n2');
    });

    it('supports --package', async () => {
      const result = await run(
        'clark run --silent --package @example/scoped-package-the-first not-in-clarkrc',
      );
      assert.equal(result, '1');
    });
  });

  it('forwards additional options to to the script a la npm run', async () => {
    let result = await run('clark run --silent --package not-scoped arguable');
    console.log(111);
    console.log(result);
    console.log(111);
    assert.equal(result, '');

    result = await run(
      'clark run --silent --package not-scoped arguable -- firstargument',
    );
    console.log(222);
    console.log(result);
    console.log(222);
    assert.equal(result, 'firstargument');

    result = await run(
      "clark run --silent --package not-scoped arguable -- '${CLARK_PACKAGE_NAME}'",
    );
    console.log(333);
    console.log(result);
    console.log(333);
    assert.equal(result, 'not-scoped');
  });
});
