import semver from 'semver';
import {format as f, makeDebug} from './debug';

const debug = makeDebug(__dirname);

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
 * Removes the range operator from a version string and converts it to a SemVer
 * @param version
 */
function extractExactVersion(version: string): string {
  const exact = semver.clean(
    version.replace(RangeOperator.Caret, '').replace(RangeOperator.Tilde, ''),
  );

  if (!exact) {
    throw new Error(`"${version}" is not a valid semver`);
  }

  return exact;
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

/**
 * Indicates if two version strings have the same range operator
 * @param left
 * @param right
 */
function hasSameOperator(left: string, right: string): boolean {
  const leftType = extractRangeOperator(left);
  const rightType = extractRangeOperator(right);
  return leftType === rightType;
}

/**
 * Selects the greater of two semver ranges combined with their most permissive
 * range operator
 * @param left
 * @param right
 */
export function select(left: string | null, right: string | null): string {
  debug(f`checking if ${left} and ${right} are compatible`);

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

  if (!semver.intersects(left, right)) {
    debug(f`${left} and ${right} are not compatible`);
    throw new Error(`"${left}" and "${right}" are not compatible`);
  }

  debug(f`${left} and ${right} are compatible`);

  const leftExact = extractExactVersion(left);
  const rightExact = extractExactVersion(right);

  debug(f`checking if ${left} and ${right} have the same range operator`);
  if (hasSameOperator(left, right)) {
    debug(f`${left} and ${right} have the same range operator`);
    if (semver.gt(leftExact, rightExact)) {
      return left;
    } else {
      return right;
    }
  }

  debug(f`${left} and ${right} do not have the same range operator`);

  const operator = extractMostPermissiveOperator(left, right);

  return `${operator}${
    semver.gt(leftExact, rightExact) ? leftExact : rightExact
  }`;
}
