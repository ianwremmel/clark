/**
 * Local type defintion for pkgUp
 */
declare module 'pkg-up' {
  /**
   * namespace
   */
  namespace pkgUp {
    /**
     * Synchronously finds the closest package.json to cwd
     */
    function sync(cwd: string): string;
  }

  export = pkgUp;
}
