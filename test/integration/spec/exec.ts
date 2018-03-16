import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {resolve} from 'path';

import run from '../lib/run';

chai.use(chaiAsPromised);
const {assert} = chai;

describe('exec', () => {
  it('executes a command in every directory', async () => {
    const result = await run('exec pwd');
    assert.lengthOf(result.split('\n'), 3);
    assert.equal(result, [`@example/scoped-package-the-first`, `@example/scoped-package-the-second`, `not-scoped`].map((dir) => resolve(__dirname, '../fixtures/monorepo/packages/node_modules', dir)).join('\n'));
  });

  it('requires a command arguments', async () => {
    const err = await assert.isRejected(run('exec'));
    assert.include(err.message, 'Not enough non-option arguments: got 0, need at least 1');
  });

  it('supports commands with pipes', async () => {
    const result = await run('exec "ls | wc -l"');
    assert.match(result, /\s*2\n\s*2\n\s*3/g);
  });

  it('supports commands with spaces', async () => {
    const result = await run('exec "ls -a"');
    assert.equal(result, '.\n..\ndist\npackage.json\n.\n..\ndist\npackage.json\n.\n..\ndist\npackage.json\ntest');
  });

  describe('with --package', () => {
    it('executes a comand in the specified package directory', async () => {
      const result = await run('exec --package-name not-scoped pwd');
      assert.lengthOf(result.split('\n'), 1);
      assert.equal(result, [`not-scoped`].map((dir) => resolve(__dirname, '../fixtures/monorepo/packages/node_modules', dir)).join('\n'));
    });

    it('executes a command in each specified package directory', async () => {
      const result = await run('exec --package-name @example/scoped-package-the-first --package-name @example/scoped-package-the-second pwd');
      assert.lengthOf(result.split('\n'), 2);
      assert.equal(result, [`@example/scoped-package-the-first`, `@example/scoped-package-the-second`].map((dir) => resolve(__dirname, '../fixtures/monorepo/packages/node_modules', dir)).join('\n'));
    });

    it('fails if the package does not exist', async () => {
      const err = await assert.isRejected(run('exec --package-name not-a-package pwd'));
      assert.include(err.message, 'Error: "not-a-package" does not appear to identify a package');
    });
  });
});
