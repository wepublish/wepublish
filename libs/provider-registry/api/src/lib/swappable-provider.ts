// Nest, its explorers and the runtime probe every provider at boot: `await`
// reads `then`, lifecycle hooks are looked up, explorers read every method of
// the prototype (`toString`, `hasOwnProperty`, ...), JSON.stringify reads
// `toJSON`. Without a configured provider these must not throw, or the whole
// app fails to start.
const PROBED_PROPERTIES = new Set<PropertyKey>([
  'then',
  'toJSON',
  'onModuleInit',
  'onApplicationBootstrap',
  'onModuleDestroy',
  'beforeApplicationShutdown',
  'onApplicationShutdown',
]);

const isProbe = (target: object, property: PropertyKey) =>
  typeof property === 'symbol' ||
  property in target ||
  PROBED_PROPERTIES.has(property);

export const createSwappableProvider = <T extends object>(
  label: string,
  getCurrent: () => T | null
): T =>
  new Proxy({} as T, {
    get(target, property) {
      const current = getCurrent();

      if (!current) {
        if (isProbe(target, property)) {
          return Reflect.get(target, property);
        }

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
