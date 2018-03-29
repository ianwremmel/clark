import debugFactory from 'debug';
import semver from 'semver';

const debug = debugFactory('clark:lib:version');

/**
 * Selects the greater of two semver ranges combined with their most permissive
 * range modifier
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

    debug(`checking if "${left}" and "${right}" have the same range modifier`);
    if (hasSameModifier(left, right)) {
      debug(`"${left}" and "${right}" have the same range modifier`);
      if (semver.gt(leftExact, rightExact)) {
        return left;
      } else {
        return right;
      }
    }

    debug(`"${left}" and "${right}" do not have the same range modifier`);

    const modifier = extractMostPermissiveModifier(left, right);

    if (semver.gt(leftExact, rightExact)) {
      return modifier + leftExact;
    } else {
      return modifier + rightExact;
    }
  } else {
    debug(`"${left}" and "${right}" are not compatible`);
    throw new Error(`"${left}" and "${right}" are not compatible`);
  }
}

/**
 * Range modifiers
 */
enum RangeModifier {
  /**
   * Caret modifier
   */
  Caret = '^',
  /**
   * Tilde modifier
   */
  Tilde = '~',
  /**
   * No modifier
   */
  Exact = '',
}

/**
 * Extracts the range modififer from a semver string
 * @param version
 */
function extractRangeModifier(version: string): RangeModifier {
  if (version.startsWith('^')) {
    return RangeModifier.Caret;
  }
  if (version.startsWith('~')) {
    return RangeModifier.Tilde;
  }

  return RangeModifier.Exact;
}

/**
 * Indicates of two version strings have the same range modifier
 * @param left
 * @param right
 */
function hasSameModifier(left: string, right: string): boolean {
  const leftType = extractRangeModifier(left);
  const rightType = extractRangeModifier(right);
  return leftType === rightType;
}

/**
 * Determines the most permissive range modifier between two version strings
 * @param left
 * @param right
 */
function extractMostPermissiveModifier(
  left: string,
  right: string,
): RangeModifier {
  const leftType = extractRangeModifier(left);
  const rightType = extractRangeModifier(right);

  if (leftType === RangeModifier.Caret || rightType === RangeModifier.Caret) {
    return RangeModifier.Caret;
  }

  if (leftType === RangeModifier.Tilde || rightType === RangeModifier.Tilde) {
    return RangeModifier.Tilde;
  }

  return RangeModifier.Exact;
}
