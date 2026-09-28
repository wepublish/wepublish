export const createSwappableProvider = <T extends object>(
  label: string,
  getCurrent: () => T | null
): T =>
  new Proxy({} as T, {
    get(_target, property) {
      const current = getCurrent();

      if (!current) {
        throw new Error(`No ${label} is configured.`);
      }

      const value = Reflect.get(current, property, current);

      return typeof value === 'function' ? value.bind(current) : value;
    },

    has(_target, property) {
      const current = getCurrent();
      return current ? property in current : false;
    },

    ownKeys() {
      const current = getCurrent();
      return current ? Reflect.ownKeys(current) : [];
    },

    getOwnPropertyDescriptor(_target, property) {
      const current = getCurrent();

      if (!current) {
        return undefined;
      }

      const descriptor = Reflect.getOwnPropertyDescriptor(current, property);

      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
