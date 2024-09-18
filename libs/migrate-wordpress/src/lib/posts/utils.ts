export const humanizeObject = (obj: object) =>
  Object.entries(obj)
    .filter(([key, value]) => value)
    .map(keyValue => keyValue.join(': '))
    .join(',')
