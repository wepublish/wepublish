export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export type Compact<T> = { [K in keyof T]?: Exclude<T[K], null> };

export const compact = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== undefined && entry !== null && entry !== ''
    )
  ) as Compact<T>;

export const ifPresent = <Value, Result>(
  value: Value | null | undefined,
  convert: (value: Value) => Result
) => (value === null || value === undefined ? undefined : convert(value));

export const enumMember = <Member extends string>(
  members: Record<string, Member>,
  value: `${Member}`
): Member => {
  const member = Object.values(members).find(candidate => candidate === value);

  if (member === undefined) {
    throw new Error(`The API does not know the puck block value ${value}`);
  }

  return member;
};

export const toPlainJson = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(toPlainJson)
  : isRecord(value) ?
    Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, toPlainJson(entry)])
    )
  : value;

export const withoutGraphQLExtras = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(withoutGraphQLExtras)
  : isRecord(value) ?
    Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key, entry]) =>
            key !== '__typename' && entry !== null && entry !== undefined
        )
        .map(([key, entry]) => [key, withoutGraphQLExtras(entry)])
    )
  : value;
