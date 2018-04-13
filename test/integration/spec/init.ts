import {assert} from 'chai';
import {execSync} from 'child_process';
import {readFile} from 'mz/fs';
import {resolve} from 'path';
import run from '../lib/run';

describe('init', () => {
  afterEach('checkout', async () => {
    console.log(
      execSync('git checkout ./test/integration/fixtures/monorepo').toString(),
    );
  });

  it('refuses to overwrite an existing config file', async () => {
    const err = ((await assert.isRejected(run('clark init'))) as any) as Error;
    assert.include(
      err.message,
      'Project already configured for clark. Pass --force to overwrite',
    );
  });

  describe('when --force is passed', () => {
    it('overwrites an existing config file', async () => {
      await run('clark init --force');
      const clarkrc = await readFile(
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
      await run("clark init --force --script test='mocha test/*/spec/**/*.js'");
      const clarkrc = await readFile(
        resolve(__dirname, '../fixtures/monorepo/.clarkrc'),
        'utf-8',
      );
      assert.deepEqual(JSON.parse(clarkrc), {
        scripts: {
          test: 'mocha test/*/spec/**/*.js',
        },
      });
    });
  });

  describe('when --script is specified more than once', () => {
    it('writes each script to .clarkrc', async () => {
      await run(
        "clark init --force --script test='mocha test/*/spec/**/*.js' --script build='babel -d dist src/**/*.js'",
      );
      const clarkrc = await readFile(
        resolve(__dirname, '../fixtures/monorepo/.clarkrc'),
        'utf-8',
      );
      assert.deepEqual(JSON.parse(clarkrc), {
        scripts: {
          build: 'babel -d dist src/**/*.js',
          test: 'mocha test/*/spec/**/*.js',
        },
      });
    });
  });

  describe('when the --script includes more than one equals sign', () => {
    it('does the right thing', async () => {
      await run("clark init --force --script test='a=b=c'");
      const clarkrc = await readFile(
        resolve(__dirname, '../fixtures/monorepo/.clarkrc'),
        'utf-8',
      );
      assert.deepEqual(JSON.parse(clarkrc), {
        scripts: {
          test: 'a=b=c',
        },
      });
    });
  });
});
