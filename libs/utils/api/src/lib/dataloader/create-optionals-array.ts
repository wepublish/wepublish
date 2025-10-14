/**
 * Used for dataloaders to generate an array with null entries when it couldn't be found
 */
export const createOptionalsArray = <
  Data,
  Attribute extends keyof Data,
  Key extends Data[Attribute],
>(
  keys: Key[],
  data: Data[],
  attribute: Attribute
): Array<Data | null> => {
  const dataMap = Object.fromEntries(
    data.map(entry => [entry[attribute], entry])
  );

  return keys.map(id => dataMap[id] ?? null);
};
