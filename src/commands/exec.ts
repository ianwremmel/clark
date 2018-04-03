import {CommandModule} from 'yargs';
import {Exec} from '../lib/handlers/exec';

const ExecCommand: CommandModule = {
  command: 'exec <command>',

  describe:
    'Execute a command in each package directory. Note: commands with spaces and pipes are supported, but must be wrapped in quotes.',

  builder(yargs) {
    return yargs
      .positional('command', {
        describe: 'The command to execute.',
        type: 'string',
      })
      .options({
        'fail-fast': {
          alias: 'ff',
          default: false,
          describe:
            'Fail as soon as a command fails, rather than running all to completion',
          type: 'boolean',
        },
        'package-name': {
          alias: ['p', 'package'],
          describe:
            'The package against which to run this command. May be specified more than once.',
          type: 'string',
        },
      });
  },

  handler: Exec.handler,
};

export = ExecCommand;
