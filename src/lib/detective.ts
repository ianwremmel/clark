import Walker from 'node-source-walk';
import TypescriptParser from 'typescript-eslint-parser';

import {format as f, makeDebug} from './debug';

const debug = makeDebug(__filename);

/**
 * Given a piece of sourcecode, locates its import statements
 * @param src
 */
export default function detective(src: string) {
  if (src === '') {
    return [];
  }

  try {
    debug(f`Attempting to parse src as TypeScript`);
    const walker = new Walker({
      ecmaFeatures: {
        jsx: true,
      },
      parser: TypescriptParser,
    });
    const result = walk(walker, src);
    debug(f`Successfully parsed src as TypeScript`);
    return result;
  } catch (err) {
    debug(f`Failed to parse src as TypeScript`);
    debug(err);
    debug(f`Attempting to parse src as ECMAScript`);
    const walker = new Walker({
      ecmaFeatures: {
        jsx: true,
      },
    });
    const result = walk(walker, src);
    debug(f`Failed to parse src as TypeScript`);
    return result;
  }
}

/**
 * placehoder. At some future point this should probably be documented.
 */
type Node = any;

/**
 * Uses walker to search src for import/require statements.
 * @param walker
 * @param src
 */
function walk(walker: Walker, src: string) {
  const dependencies: string[] = [];
  walker.walk(src, function(node: Node) {
    switch (node.type) {
      case 'ImportDeclaration':
        if (node.source && node.source.value) {
          dependencies.push(node.source.value);
        }
        break;
      case 'ExportNamedDeclaration':
      case 'ExportAllDeclaration':
        if (node.source && node.source.value) {
          dependencies.push(node.source.value);
        }
        break;
      case 'TSExternalModuleReference':
        if (node.expression && node.expression.value) {
          dependencies.push(node.expression.value);
        }
        break;
      case 'CallExpression':
        if (node.callee.type === 'Import' && node.arguments.length) {
          dependencies.push(node.arguments[0].value);
        }

        if (
          node.callee.name === 'require' &&
          node.arguments[0].type === 'Literal'
        ) {
          dependencies.push(node.arguments[0].value);
        }

        break;
      default:
        return;
    }
  });
  return dependencies;
}
