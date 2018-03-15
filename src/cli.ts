import yargs from 'yargs';

// yargs does its work in the argv getter, so we need to reference it in order
// for the program to execute.
yargs({})
  // support ts extensions during development
  .commandDir('./commands', {extensions: (__dirname.includes('src') ? ['js', 'ts'] : ['js'])})
  .demandCommand(1)
  .help()
  .recommendCommands()
  .parse();
