import {assert} from 'chai';
import {execSync} from 'child_process';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import run from '../lib/run';

describe('init', () => {
  afterEach('checkout', async () => {
    console.log(
      execSync('git checkout ./test/integration/fixtures/monorepo').toString(),
    );
  });

  it('refuses to overwrite an existing config file', async () => {
    const err = await assert.isRejected(run('init'));
    assert.include(
      err.message,
      'Project already configured for clark. Pass --force to overwrite',
    );
  });

  describe('when --force is passed', () => {
    it('overwrites an existing config file', async () => {
      const result = await run('init --force');
      const clarkrc = readFileSync(
        resolve(__dirname, '../fixtures/monorepo/.clarkrc'),
        'utf-8',
      );
      assert.deepEqual(JSON.parse(clarkrc), {
        scripts: {},
      });
    });
  });

  describe('when --script is specified once', () => {
    it('writes the script to .clarkrc', async () => {
      const result = await run(`init --force --script hello="echo 'world=42'"`);
      const clarkrc = readFileSync(
        resolve(__dirname, '../fixtures/monorepo/.clarkrc'),
        'utf-8',
      );
      assert.deepEqual(JSON.parse(clarkrc), {
        scripts: {
          hello: "echo 'world=42'",
        },
      });
    });
  });

  describe('when --script is specified more than once', () => {
    it('writes each script to .clarkrc', async () => {
      const result = await run(
        `init --force --script hello="echo 'world=42'" --script world="echo 'world=pi'"`,
      );
      const clarkrc = readFileSync(
        resolve(__dirname, '../fixtures/monorepo/.clarkrc'),
        'utf-8',
      );
      assert.deepEqual(JSON.parse(clarkrc), {
        scripts: {
          hello: "echo 'world=42'",
          world: "echo 'world=pi'",
        },
      });
    });
  });
});
