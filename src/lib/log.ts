/**
 * logger
 */
export function log(
  options: log.Options,
  debug: (message?: any, ...optionalParams: any[]) => void,
  ...args: any[]
): void {
  if (options.silent) {
    debug(...args);
  } else {
    console.log(...args);
  }
}

/**
 * Namespace
 */
export namespace log {
  /**
   * Options object
   */
  export interface Options {
    silent?: true;
  }
}
console.log();
