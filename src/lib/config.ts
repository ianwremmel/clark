import debugFactory from 'debug';
import rc from 'rc';

const debug = debugFactory('clark:lib:config');

export interface Config {
  scripts?: ScriptConfig
}

export interface ScriptConfig {
  [key: string]: string
}

export function load() : Config {
  debug('Looking for .clarkrc files');
  const conf = rc('clark', {});
  if (conf.configs && conf.configs.length) {
    debug(`Found "${conf.configs.length}" .clarkrc files`);
    return conf;
  }
  debug(`Did not find any .clarkrc files`);
  return {};
}
