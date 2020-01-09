import {readFileSync} from 'fs';

import chalk from 'chalk';
import debugFactory, {IDebugger} from 'debug';
import {sync as pkgUp} from 'pkg-up';
import * as supportsColor from 'supports-color';

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
  const rootName = pkg.name.includes('/')
    ? (pkg.name.split('/').pop() as string)
    : pkg.name;

  return debugFactory(
    filename
      .substr(filename.indexOf(rootName))
      .replace('src/', '')
      .replace(/\/|\\/g, ':')
      .replace(/.[jt]sx?$/, ''),
  );
}

/**
 * Formatter for template strings.
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
 */
export function colorize(value: any): string {
  if (!((supportsColor as any) as ExtendedSupportsColor).stdout) {
    return `"${value}"`;
  }

  switch (typeof value) {
    case 'boolean':
      return value ? chalk.green(String(value)) : chalk.red(String(value));
    case 'number':
      return chalk.yellow(String(value));
    case 'string':
      // node modules
      if (value.startsWith('@')) {
        return chalk.cyan(value);
      }
      // filenames
      if (value.includes('/')) {
        return chalk.blue(value);
      }
      // strings
      return chalk.yellow(value);
    default:
      return chalk.grey(value);
  }
}
