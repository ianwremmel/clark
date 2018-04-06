import {writeFile} from 'mz/fs';
import {resolve} from 'path';
import {Config, ScriptConfig} from '../config';
import {format as f, makeDebug} from '../debug';
import {findProjectRoot, hasRc} from '../project';

const debug = makeDebug(__dirname);

/**
 * Contains the handler for the init command
 */
export namespace Init {
  /**
   * Implementation of the init command
   * @param options
   */
  export async function handler(options: Options) {
    debug('locating root directory');
    const rootDir = await findProjectRoot();
    debug('checking if root dir contains a .clarkrc');

    if ((await hasRc(rootDir)) && !options.force) {
      throw new Error(
        'Project already configured for clark. Pass --force to overwrite',
      );
    }

    const extract = (s: ScriptConfig, item: string) => {
      const [key, value] = item.split(/=(.+)/);
      s[key] = value;
      return s;
    };

    debug('generating scripts hash');
    let scripts: ScriptConfig = {};
    if (options.script) {
      if (Array.isArray(options.script)) {
        scripts = options.script.reduce(extract, scripts);
      } else {
        extract(scripts, options.script);
      }
    }

    const config: Config = {
      scripts,
    };

    debug(f`writing .clarkrc to ${rootDir}`);
    writeFile(
      resolve(rootDir, '.clarkrc'),
      `${JSON.stringify(config, null, 2)}\n`,
    );
    debug(f`wrote .clarkrc to ${rootDir}`);
  }

  /**
   * Init handler options
   */
  export interface Options {
    force?: boolean;
    script?: string | string[];
  }
}
