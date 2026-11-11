import { joinPath, withoutRoot } from './field-path';

type Entry = { readonly fields: number; readonly leaves: number };

export type RegisteredFields = ReadonlyMap<string, Entry>;

export type FieldRegistry = {
  register: (path: string, coversChildren: boolean) => () => void;
  subscribe: (listener: () => void) => () => void;
  snapshot: () => RegisteredFields;
};

const coveredByAncestor = (registered: RegisteredFields, path: string) => {
  let ancestor = '';

  for (const segment of path.split('.').slice(0, -1)) {
    ancestor = joinPath(ancestor, segment);

    if ((registered.get(ancestor)?.leaves ?? 0) > 0) {
      return true;
    }
  }

  return false;
};

export function reaches(
  registered: RegisteredFields,
  errorPath: string
): boolean {
  const path = withoutRoot(errorPath);

  return registered.has(path) || coveredByAncestor(registered, path);
}

export function createFieldRegistry(): FieldRegistry {
  const listeners = new Set<() => void>();
  let registered: RegisteredFields = new Map();

  const update = (path: string, fields: number, leaves: number) => {
    const entry = registered.get(path) ?? { fields: 0, leaves: 0 };
    const next = new Map(registered);
    const changed = {
      fields: entry.fields + fields,
      leaves: entry.leaves + leaves,
    };

    if (changed.fields > 0) {
      next.set(path, changed);
    } else {
      next.delete(path);
    }

    registered = next;

    for (const listener of listeners) {
      listener();
    }
  };

  return {
    register: (path, coversChildren) => {
      const leaves = coversChildren ? 1 : 0;

      update(path, 1, leaves);

      return () => update(path, -1, -leaves);
    },
    subscribe: listener => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    snapshot: () => registered,
  };
}
