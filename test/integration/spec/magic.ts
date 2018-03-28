import {assert} from 'chai';

import run from '../lib/run';

describe('magic', () => {
  it('generates commands from the local .clarkrc', async () => {
    const result = await run('--help');
    assert.include(result, 'local');
    assert.include(result, 'override');
  });

  it('executes a script in each package directory', async () => {
    const result = await run('local');
    assert.equal(result, 'run\nrun\nrun');
  });

  describe('when a package has an npm script of the same name', () => {
    it('executes the override or falls back to the .clarkrc version', async () => {
      const result = await run('override');
      assert.equal(
        result,
        'not overridden\nnot overridden\nthis is an override',
      );
    });
  });

  describe('when invoked with --package', () => {
    it('invokes within only that package', () => {
      it('executes the override or falls back to the .clarkrc version', async () => {
        const result = await run('override --package not-scoped');
        assert.equal(result, 'this is an override');
      });
    });

    it('invokes within only that package', () => {
      it('executes the override or falls back to the .clarkrc version', async () => {
        const result = await run(
          'override --package not-scoped --package @example/scoped-package-the-first',
        );
        assert.equal(result, 'not overridden\nthis is an override');
      });
    });
  });
});
