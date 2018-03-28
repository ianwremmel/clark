import debugFactory from 'debug';
import semver from 'semver';

const debug = debugFactory('clark:lib:version');

/**
 * Selcts the greater of two semver ranges combined with their most permissive
 * range modifier
 * @param left
 * @param right
 */
export function select(left: string | null, right: string | null): string {
  debug(`checking if "${left}" and "${right}" are compatible`);

  if (!left && right) {
    return right;
  }

  if (!right && left) {
    return left;
  }

  if (!right && !left) {
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
    if (hasSameModifer(left, right)) {
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
enum rangeModifier {
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
function extractRangeModifer(version: string): rangeModifier {
  if (version.startsWith('^')) {
    return rangeModifier.Caret;
  }
  if (version.startsWith('~')) {
    return rangeModifier.Tilde;
  }

  return Exact;
}

/**
 * Indicates of two version strings have the same range modifier
 * @param left
 * @param right
 */
function hasSameModifer(left: string, right: string): boolean {
  const leftType = extractRangeModifer(left);
  const rightType = extractRangeModifer(right);
  return leftType === rightType;
}

/**
 * Determines the most permissive range modifier between two version strings
 * @param left
 * @param right
 */
function extractMostPermissiveModifier(left: string, right: string) {
  const leftType = extractRangeModifer(left);
  const rightType = extractRangeModifer(right);

  if (leftType === rangeModifier.Caret || rightType === rangeModifier.Caret) {
    return rangeModifier.Caret;
  }

  if (leftType === rangeModifier.Tilde || rightType === rangeModifier.Tilde) {
    return rangeModifier.Tilde;
  }

  return rangeModifier.Exact;
}
