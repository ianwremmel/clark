import debugFactory from 'debug';
import rc from 'rc';

const debug = debugFactory('clark:lib:config');

/**
 * Root of the config object
 */
export interface Config {
  scripts?: ScriptConfig;
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
  const conf = rc('clark', {});
  if (conf.configs && conf.configs.length) {
    debug(`Found "${conf.configs.length}" .clarkrc files`);
    return conf;
  }
  debug('Did not find any .clarkrc files');
  return {};
}
