import {assert} from 'chai';
import {resolve} from 'path';

import run from '../lib/run';

describe('when an error occurs', () => {
  describe('in an async command', () => {
    describe('and --stacks is not passed', () => {
      it('prints only the error message', async () => {
        const err = ((await assert.isRejected(
          run('asyncfail'),
        )) as any) as Error;
        console.log(err);
        assert.include(err.message, 'synchronous failure');
        assert.notInclude(err.message, 'Error:');
        assert.notInclude(err.message, 'cli.ts');
      });
    });

    describe('and --stacks is passed', () => {
      it('prints the stack trace', async () => {
        const err = ((await assert.isRejected(
          run('asyncfail --stack'),
        )) as any) as Error;
        console.log(err);

        assert.include(err.message, 'synchronous failure');
        assert.include(err.message, 'Error:');
        assert.include(err.message, 'cli.ts');
      });
    });
  });

  describe('in a sync command', () => {
    describe('and --stacks is not passed', () => {
      it('prints only the error message', async () => {
        const err = ((await assert.isRejected(run('fail'))) as any) as Error;
        console.log(err);
        assert.include(err.message, 'synchronous failure');
        assert.notInclude(err.message, 'Error:');
        assert.notInclude(err.message, 'cli.ts');
      });
    });

    describe('and --stacks is passed', () => {
      it('prints the stack trace', async () => {
        const err = ((await assert.isRejected(
          run('fail --stack'),
        )) as any) as Error;
        console.log(err);

        assert.include(err.message, 'synchronous failure');
        assert.include(err.message, 'Error:');
        assert.include(err.message, 'cli.ts');
      });
    });
  });
});
