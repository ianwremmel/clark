import {CommandModule} from 'yargs';
import {Run} from '../lib/handlers/run';

const RunCommand: CommandModule = {
  command: 'run [script]',

  describe:
    'Runs a script in each package directory. This is different from `exec` in that scripts should be defined in .clarkrc and may be overridden on a per-package basis via npm scripts. npm scripts defined only in subpackage package.jsons can be run this way, but only scripts named in .clarkrc will populate the help output.',

  builder: Run.builder,

  handler: Run.handler,
};

export = RunCommand;
