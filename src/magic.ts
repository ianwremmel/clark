import {readFileSync} from 'fs';
import {resolve} from 'path';
import {Argv} from 'yargs';
import {Exec} from './lib/handlers/exec';

interface Config {
  scripts: ScriptsConfig;
}

interface ScriptsConfig {
  global: ScriptConfigObject;
  package: ScriptConfigObject;
}

interface ScriptConfigObject {
  [key: string]: string;
}

export function magic(y: Argv): Argv {
  const clarkrcFilename = resolve(process.cwd(), '.clarkrc.json');
  const rawrc = readFileSync(clarkrcFilename, 'utf-8');
  const config: Config = JSON.parse(rawrc);

  if (config.scripts && config.scripts.package) {
    return Object.entries(config.scripts.package).reduce(
      (yy: Argv, [command, script]: [string, string]): Argv =>
        yy.command(
          command,
          `the "${command}" command is generated from your local .clarkrc.json. It runs "${script} "in each package directory.`,
          {},
          async (): Promise<void> => await Exec.handler({command: script}),
        ),
      y,
    );
  }

  return y;
}
