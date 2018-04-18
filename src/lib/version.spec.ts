import {assert} from 'chai';

import {select} from './version';

describe('version', () => {
  describe('select()', () => {
    it('selects the greater of two compatible semver ranges', () => {
      [
        ['^1.0.0', '^1.1.0', '^1.1.0'],
        ['^1.1.0', '^1.0.0', '^1.1.0'],
        ['~1.3.0', '^1.1.0', '^1.3.0'],
        ['~1.0.0', '~1.0.1', '~1.0.1'],
        ['^1.0.0', '1.1.0', '^1.1.0'],
      ].forEach(([left, right, correct]) => {
        assert.equal(
          select(left, right),
          correct,
          `the greater of [${left}, ${right}] is ${correct}`,
        );
      });
    });

    it('selects the only version specified if the other is null', () => {
      [['^1.1.0', null, '^1.1.0'], [null, '^1.1.0', '^1.1.0']].forEach(
        ([left, right, correct]) => {
          assert.equal(select(left, right), correct);
        },
      );
    });

    it('selects the more permissive of two compatible semver ranges', () => {
      [
        ['~1.1.0', '^1.0.0', '^1.1.0'],
        ['^1.0.0', '~1.1.0', '^1.1.0'],
        ['^1.0.0', '~1.3.0', '^1.3.0'],
        ['^1.4.0', '~1.4.0', '^1.4.0'],
        ['^1.4.10', '~1.4.20', '^1.4.20'],
      ].forEach(([left, right, correct]) => {
        assert.equal(
          select(left, right),
          correct,
          `the more permissive of [${left}, ${right}] is ${correct}`,
        );
      });
    });

    it('throws if semver ranges are not compatible', () => {
      [
        ['1.0.0', '2.0.0'],
        ['~1.0.0', '^1.1.0'],
        ['^0.1.0', '^0.0.1'],
        ['~0.1.0', '~0.2.0'],
        ['^1.3.0', '~1.1.0'],
      ].forEach(([left, right]) => {
        assert.throws(
          () => select(left, right),
          `"${left}" and "${right}" are not compatible`,
        );
      });

      assert.throws(
        () => select(null, null),
        'Cannot select a version from "null" and "null"',
      );
    });
  });
});
