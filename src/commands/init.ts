import {CommandModule} from 'yargs';

import {Init} from '../lib/handlers/init';

const InitCommand: CommandModule = {
  describe: 'Create a .clarkrc file in your project root',

  builder(yargs) {
    return yargs.options({
      force: {
        alias: 'f',
        default: false,
        description: 'Overwrite .clarkrc with new config',
        type: 'boolean',
      },
      script: {
        alias: 's',
        description: 'Identifies a script to add to the config file',
        type: 'string',
      },
    });
  },

  handler: Init.handler,
};

export = InitCommand;
