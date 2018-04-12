import {CommandModule} from 'yargs';
import {Run} from '../lib/handlers/run';

const RunCommand: CommandModule = {
  command: 'run [script]',

  describe:
    'Runs a script in each package directory. This is different from `exec` in that scripts must be defined in .clarkrc and may be overridden on a per-package basis via npm scripts.',

  builder: Run.builder,

  handler: Run.handler,
};

export = RunCommand;
