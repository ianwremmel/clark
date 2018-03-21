import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {resolve} from 'path';

import run from '../lib/run';

chai.use(chaiAsPromised);
const {assert} = chai;

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

  describe('when a packages has an npm script of the same name', () => {
    it('executes the override or falls back to the .clarkrc version', async () => {
      const result = await run('override');
      assert.equal(
        result,
        'not overridden\nnot overridden\nthis is an override',
      );
    });
  });
});
