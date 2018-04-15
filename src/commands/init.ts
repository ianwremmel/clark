import {Command, flags} from '@oclif/command';
import {writeFile} from 'mz/fs';
import {resolve} from 'path';

import {Config, ScriptConfig} from '../lib/config';
import {format as f, makeDebug} from '../lib/debug';
import {findProjectRoot, hasRc} from '../lib/project';

const debug = makeDebug(__dirname);

export default class Init extends Command {
  static description = 'Create a .clarkrc file in your project root';

  static flags = {
    force: flags.boolean({
      char: 'f',
      description: 'Overwrite .clarkrc with new config',
    }),
    script: flags.string({
      char: 's',
      description: 'Identifies a script to add to the config file',
      multiple: true,
    }),
  };

  async run() {
    const {flags: options} = this.parse(Init);

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
}
