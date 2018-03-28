import chalk from 'chalk';
import debugFactory, {IDebugger} from 'debug';
import {readFileSync} from 'fs';
import invariant from 'invariant';
import {sync as pkgUp} from 'pkg-up';
import supportsColor from 'supports-color';

interface ExtendedSupportsColor {
  stdout: boolean;
}

const pkg = JSON.parse(readFileSync(pkgUp(__dirname), 'utf-8'));

/**
 * Wrapper around debug to ensure consistency across the project
 * @example
 * const {d, f} = require('./debug')(__filename)
 * d('a plain string');
 * d(f`a string with ${1} variable`);
 */
export function makeDebug(filename: string): IDebugger {
  invariant(filename, '$filename is required');
  invariant(typeof filename === 'string', '$filename must be a string');

  const rootName = pkg.name.includes('/')
    ? (pkg.name.split('/').pop() as string)
    : pkg.name;

  return debugFactory(
    filename
      .substr(filename.indexOf(rootName))
      .replace('src/', '')
      .replace(/\/|\\/g, ':')
      .replace(/.js$/, ''),
  );
}

/**
 * Formatter for template strings.
 * @param literals
 * @param placeholders
 */
export function format(
  literals: TemplateStringsArray,
  ...placeholders: any[]
): string {
  let result = '';
  for (let i = 0; i < literals.length; i++) {
    result += literals[i];
    // If we've reached that last position, don't print params[i] (params will
    // always have one less entry than tpl)
    if (placeholders.length !== i) {
      result += colorize(placeholders[i]);
    }
  }
  return result;
}

/**
 * Colorizes variables for template string
 * @param value
 */
export function colorize(value: any): string {
  if (!((supportsColor as any) as ExtendedSupportsColor).stdout) {
    return `"${value}"`;
  }

  switch (typeof value) {
    case 'boolean':
      return value ? chalk.green(value) : chalk.red(value);
    case 'number':
      return chalk.yellow(value);
    case 'string':
      if (value.includes('/')) {
        return chalk.green(value);
      }
      return chalk.blue(value);
    default:
      return chalk.grey(value);
  }
}