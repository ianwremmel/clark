interface AnyObject {
  [key: string]: any;
}

/**
 * Returns a new clone of `obj` with its keys sorted alphabetically
 * @param obj
 */
export function sortObject(obj: object): object {
  return Object.entries(obj)
    .sort((left, right) => {
      if (left[0] < right[0]) {
        return -1;
      }
      if (left[0] > right[0]) {
        return 1;
      }

      return 0;
    })
    .reduce<AnyObject>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}
