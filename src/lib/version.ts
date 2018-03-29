import debugFactory from 'debug';
import semver from 'semver';

const debug = debugFactory('clark:lib:version');

/**
 * Selects the greater of two semver ranges combined with their most permissive
 * range operator
 * @param left
 * @param right
 */
export function select(left: string | null, right: string | null): string {
  debug(`checking if "${left}" and "${right}" are compatible`);

  // There are *much* simpler ways to write this, but typescript disagrees.

  if (left === null) {
    if (right) {
      return right;
    }
    throw new Error('Cannot select a version from "null" and "null"');
  }

  if (right === null) {
    if (left) {
      return left;
    }
    throw new Error('Cannot select a version from "null" and "null"');
  }

  if (semver.intersects(left, right)) {
    debug(`"${left}" and "${right}" are compatible`);

    const leftExact = semver.clean(left.replace('^', '').replace('~', ''));
    const rightExact = semver.clean(right.replace('^', '').replace('~', ''));

    if (!leftExact) {
      throw new Error(`"${left}" is not a valid semver`);
    }

    if (!rightExact) {
      throw new Error(`"${right}" is not a valid semver`);
    }

    debug(`checking if "${left}" and "${right}" have the same range operator`);
    if (hasSameOperator(left, right)) {
      debug(`"${left}" and "${right}" have the same range operator`);
      if (semver.gt(leftExact, rightExact)) {
        return left;
      } else {
        return right;
      }
    }

    debug(`"${left}" and "${right}" do not have the same range operator`);

    const operator = extractMostPermissiveOperator(left, right);

    if (semver.gt(leftExact, rightExact)) {
      return operator + leftExact;
    } else {
      return operator + rightExact;
    }
  } else {
    debug(`"${left}" and "${right}" are not compatible`);
    throw new Error(`"${left}" and "${right}" are not compatible`);
  }
}

/**
 * Range operators
 */
enum RangeOperator {
  /**
   * Caret operator
   */
  Caret = '^',
  /**
   * Tilde operator
   */
  Tilde = '~',
  /**
   * No operator
   */
  Exact = '',
}

/**
 * Extracts the range modififer from a semver string
 * @param version
 */
function extractRangeOperator(version: string): RangeOperator {
  if (version.startsWith('^')) {
    return RangeOperator.Caret;
  }
  if (version.startsWith('~')) {
    return RangeOperator.Tilde;
  }

  return RangeOperator.Exact;
}

/**
 * Indicates of two version strings have the same range operator
 * @param left
 * @param right
 */
function hasSameOperator(left: string, right: string): boolean {
  const leftType = extractRangeOperator(left);
  const rightType = extractRangeOperator(right);
  return leftType === rightType;
}

/**
 * Determines the most permissive range operator between two version strings
 * @param left
 * @param right
 */
function extractMostPermissiveOperator(
  left: string,
  right: string,
): RangeOperator {
  const leftType = extractRangeOperator(left);
  const rightType = extractRangeOperator(right);

  if (leftType === RangeOperator.Caret || rightType === RangeOperator.Caret) {
    return RangeOperator.Caret;
  }

  if (leftType === RangeOperator.Tilde || rightType === RangeOperator.Tilde) {
    return RangeOperator.Tilde;
  }

  return RangeOperator.Exact;
}
