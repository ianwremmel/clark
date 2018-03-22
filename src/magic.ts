import {Argv} from 'yargs';
import {load} from './lib/config';
import {execScript, gather} from './lib/packages';

/**
 * Wrapper around yargs which introduces yargs commands based on options in the
 * monorepo's .clarkrc file.
 * @param y
 */
export function magic(y: Argv): Argv {
  const config = load();
  if (config.scripts && config.scripts) {
    return Object.entries(config.scripts).reduce(
      (yy: Argv, [command, script]: [string, string]): Argv =>
        yy.command(
          command,
          `the "${command}" command is generated from your local .clarkrc. It runs "${script} "in each package directory.`,
          {},
          async (): Promise<void> => {
            for (const packageName of await gather({})) {
              await execScript(command, packageName, script);
            }
          },
        ),
      y,
    );
  }

  return y;
}
