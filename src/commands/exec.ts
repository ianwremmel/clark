import {CommandModule} from 'yargs';
import {Exec} from '../lib/handlers/exec';

const ExecCommand : CommandModule = {
  command: 'exec <command>',

  describe: 'Execute a command in each package directory',

  builder(yargs) {
    return yargs.positional('command', {
      describe: 'The command to execute',
      type: 'string'
    })
  },

  handler: Exec.handler
}

export = ExecCommand;
