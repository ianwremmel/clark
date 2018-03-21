import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {resolve} from 'path';

import run from '../lib/run';

chai.use(chaiAsPromised);
const {assert} = chai;

describe('magic', () => {
  it('generates commands from the local .clarkrc.json', async () => {
    const result = await run('--help');
    assert.include(result, 'local');
    assert.include(result, 'override');
  });

  it('executes a script in each package directory', async () => {
    const result = await run('local');
    assert.equal(result, 'run\nrun\nrun');
  });
});
