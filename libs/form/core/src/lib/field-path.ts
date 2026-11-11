export type ItemScope = Readonly<Partial<Record<string, string>>>;

export const joinPath = (prefix: string, key: string) => {
  if (prefix === '') {
    return key;
  }

  return key === '' ? prefix : `${prefix}.${key}`;
};

export const parentPath = (path: string) => {
  const index = path.lastIndexOf('.');

  return index === -1 ? '' : path.slice(0, index);
};

export const lastSegment = (path: string) =>
  path.slice(path.lastIndexOf('.') + 1);

export function resolvePath(name: string, scope: ItemScope): string {
  let resolved = '';
  let schemaPrefix = '';

  for (const segment of name.split('.')) {
    if (segment === '*') {
      const item = scope[schemaPrefix];

      if (item === undefined) {
        throw new Error(
          `"${name}" uses "*" outside an item of "${schemaPrefix}".`
        );
      }

      resolved = item;
    } else {
      resolved = joinPath(resolved, segment);
    }

    schemaPrefix = joinPath(schemaPrefix, segment);
  }

  return resolved;
}

export const withoutRoot = (path: string) => path.replace(/\.root$/, '');

export const isRootPath = (path: string) =>
  path === 'root' || path.startsWith('root.');

export const schemaPathOf = (path: string) =>
  withoutRoot(path)
    .split('.')
    .map(segment => (/^\d+$/.test(segment) ? '*' : segment))
    .join('.');
