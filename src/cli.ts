import y, {Argv} from 'yargs';

import {magic} from './magic';

// so, yargs's d.ts is...weird. This is an unfortunate set of castings to
// convince typescript that all is well.
const yargs = (y as any) as Argv;

const argv = magic(yargs) // support ts extensions during development
  .commandDir('./commands', {
    extensions: __dirname.includes('src') ? ['js', 'ts'] : ['js'],
  })
  .command('fail', 'test helper', {}, () => {
    throw new Error('synchronous failure');
  })
  .command('asyncfail', 'test helper', {}, async () => {
    throw new Error('asynchronous failure');
  })
  .demandCommand(1)
  .help()
  .recommendCommands()
  .fail((msg, err, yargs) => {
    if (err) {
      if (argv.stack) {
        console.error(err);
      } else {
        console.error(err.message);
      }
    }

    if (msg) {
      console.error(yargs.showHelp());
      console.error(msg);
    }

    process.exit(1);
  })
  .parse();
