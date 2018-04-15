import {test} from '@oclif/test';
import {assert} from 'chai';
import {execSync} from 'child_process';
import {resolve} from 'path';

import {readFile} from '../lib/run';

describe('init', () => {
  afterEach('checkout', async () => {
    console.log(
      execSync(
        `git checkout ${resolve(__dirname, '../fixtures/monorepo')}`,
      ).toString(),
    );
  });

  test
    .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
    .stdout()
    .stderr()
    .command(['init'])
    .catch((err) => {
      assert.match(
        err.message,
        /Project already configured for clark. Pass --force to overwrite/,
      );
    })
    .it('refuses to overwrite an existing config file');

  describe('when --force is passed', () => {
    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command(['init', '--force'])
      .it('overwrites an existing config file', async () => {
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
    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command([
        'init',
        '--force',
        '--script',
        'test=mocha test/*/spec/**/*.js',
      ])
      .it('writes the script to .clarkrc', async () => {
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
    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command([
        'init',
        '--force',
        '--script',
        'test=mocha test/*/spec/**/*.js',
        '--script',
        'build=babel -d dist src/**/*.js',
      ])
      .it('writes each script to .clarkrc', async () => {
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
    test
      .do(() => process.chdir(resolve(__dirname, '../fixtures/monorepo')))
      .stdout()
      .stderr()
      .command(['init', '--force', '--script', 'test=a=b=c'])
      .it('does the right thing', async () => {
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
