import y, {Argv} from 'yargs';

// so, yargs's d.ts is...weird. This is an unfortunate set of castings to
// convince typescript that all is well.
const yargs = (y as any) as Argv;
yargs
  // support ts extensions during development
  .commandDir('./commands', {
    extensions: __dirname.includes('src') ? ['js', 'ts'] : ['js'],
  })
  .options({
    silent: {
      description: 'Suppresses output from all log statements',
      default: false,
      type: 'boolean',
    },
  })
  .demandCommand(1)
  .help()
  .recommendCommands()
  .parse();
