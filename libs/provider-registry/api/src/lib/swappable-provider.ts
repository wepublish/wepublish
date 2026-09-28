/**
 * A stable stand-in for a provider that can be replaced at runtime.
 *
 * Consumers such as MailContext capture the provider once in their constructor
 * and keep it for the lifetime of the process. Handing them this proxy instead
 * of the instance means a reload can swap the implementation underneath them
 * without touching a single call site.
 */
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

      // Read through the instance, not the proxy: a getter that runs with
      // `this` bound to the proxy would recurse straight back into this trap.
      const value = Reflect.get(current, property, current);

      // Bind to the real instance: methods that reach for private state break
      // when `this` is the proxy.
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

      // A proxy may not report a non-configurable property that its target
      // does not have.
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
