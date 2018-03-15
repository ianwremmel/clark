import yargs from 'yargs';

// yargs does its work in the argv getter, so we need to reference it in order
// for the program to execute.
// tslint:disable-next-line:no-unused-expression
yargs({})
  .commandDir('../dist/commands')
  .demandCommand(1)
  .help()
  .recommendCommands()
  .argv;
