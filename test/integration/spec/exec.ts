import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {resolve} from 'path';

import run from '../lib/run';

chai.use(chaiAsPromised);
const {assert} = chai;

describe('exec', () => {
  it('exectus a command in every directory', async () => {
    const result = await run('exec pwd');
    assert.lengthOf(result.split('\n'), 3);
    assert.equal(result, [
      `@example/scoped-package-the-first`,
      `@example/scoped-package-the-second`,
      `not-scoped`
    ]
      .map((dir) => resolve(__dirname, '../fixtures/monorepo/packages/node_modules', dir))
      .join('\n'));
  });

  it('requires a command arguments', async () => {
    const err = await assert.isRejected(run('exec'));
    assert.include(err.message, 'Not enough non-option arguments: got 0, need at least 1');
  });

  it('supports commands with spaces');

  describe('with --package', () => {
    it('executes a comand in the specified package directory');
    it('fails if the package does not exist');
  });
});
