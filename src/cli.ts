import y, {Argv} from 'yargs';

import {magic} from './magic';

// so, yargs's d.ts is...weird. This is an unfortunate set of castings to
// convince typescript that all is well.
const yargs = (y as any) as Argv;
magic(yargs)
  // support ts extensions during development
  .commandDir('./commands', {
    extensions: __dirname.includes('src') ? ['js', 'ts'] : ['js'],
  })
  .demandCommand(1)
  .help()
  .recommendCommands()
  .parse();
