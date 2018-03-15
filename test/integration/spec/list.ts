import {assert} from 'chai';

import run from '../lib/run';

describe('list', () => {
  it('lists all packages in the project directory', async() => {
    const result = await run('list');
    assert.lengthOf(result.split('\n'), 3);
    assert.equal(result, `@example/scoped-package-the-first
@example/scoped-package-the-second
not-scoped`)
  });
});
