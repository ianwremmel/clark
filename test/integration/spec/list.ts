import {resolve} from 'path';

import {test} from '@oclif/test';
import {assert} from 'chai';

describe('list', () => {
  test
    .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
    .stdout()
    .stderr()
    .command(['list'])
    .it('lists all packages in the project directory', async (ctx) => {
      assert.equal(
        ctx.stdout,
        `@example/scoped-package-the-first
@example/scoped-package-the-second
not-scoped
`,
      );
    });
});
