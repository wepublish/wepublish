/*
 * Mandrill (and our placeholder generation) does not support nested objects.
 * This flattens a (possibly nested) object into a single-level map where nested
 * keys are joined with underscores, e.g. `{ subscription: { memberPlan: { name } } }`
 * becomes `{ subscription_memberPlan_name }`. Arrays are flattened by index.
 *
 * This is the single source of truth for how mail template data is turned into
 * the flat placeholder keys that templates reference.
 */
export function flattenObjForMandrill<T>(ob: T): Record<string, string> {
  const nestedObject: Record<string, string> = {};

  for (const i in ob) {
    const nestedObj = ob[i];

    if (Array.isArray(nestedObj)) {
      for (const j in nestedObj) {
        if (nestedObj[j] && typeof nestedObj[j] === 'object') {
          const returnedNestedObject = flattenObjForMandrill(nestedObj[j]);

          for (const k in returnedNestedObject) {
            nestedObject[`${i}_${j}_${k}`] = returnedNestedObject[k];
          }
        } else {
          nestedObject[`${i}_${j}`] = nestedObj[j];
        }
      }
    } else if (nestedObj && typeof nestedObj === 'object') {
      const returnedNestedObject = flattenObjForMandrill(nestedObj);

      for (const j in returnedNestedObject) {
        nestedObject[`${i}_${j}`] = returnedNestedObject[j];
      }
    } else {
      // eventho it should be string according to Mandrill typings
      // it accepts booleans, numbers etc.
      nestedObject[i] = nestedObj as any;
    }
  }

  return nestedObject;
}
