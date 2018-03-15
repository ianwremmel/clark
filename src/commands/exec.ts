import {CommandModule} from 'yargs';

const ExecCommand : CommandModule = {
    async handler() {
      console.log('it works!');
    }
}

export = ExecCommand;
