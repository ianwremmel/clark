/**
 * Local type defintion for node-source-walk
 */
declare module 'node-source-walk' {
  /**
   * walker options
   */
  interface WalkerOptions {
    ecmaFeatures: EcmaFeatures;
    parser?: Parser;
  }

  /**
   * ecma features
   */
  interface EcmaFeatures {
    jsx: true;
  }

  /**
   * node
   */
  type Node = any;

  /**
   * parser
   */
  type Parser = any;

  /**
   * walker
   */
  class Walker {
    constructor(options?: WalkerOptions);

    /**
     * walk
     */
    walk(src: string, callback: (node: Node) => void): void;
  }

  export = Walker;
}
