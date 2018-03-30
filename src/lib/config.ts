import debugFactory from 'debug';
import rc from 'rc';

const debug = debugFactory('clark:lib:config');

/**
 * Root of the config object
 */
export interface Config {
  scripts?: ScriptConfig;
  /**
   * Glob or array of globs indicating the directories that contain the
   * monorepo's `package.json`s
   */
  include?: string | string[];
}

/**
 * Scripts section of the config object
 */
export interface ScriptConfig {
  [key: string]: string;
}

/**
 * Loads the .clarkrc config file for this project
 */
export function load(): Config {
  debug('Looking for .clarkrc files');
  const conf = rc('clark', {
    // `packages/node_modules/*/package.json` and
    // `packages/node_modules/@*/*/package.json` are the only valid package
    // locations in an alle-style monorep
    include: 'packages/node_modules/{*,@*/*}',
  });
  if (conf.configs && conf.configs.length) {
    debug(`Found "${conf.configs.length}" .clarkrc files`);
    return conf;
  }
  debug('Did not find any .clarkrc files');
  return {};
}
