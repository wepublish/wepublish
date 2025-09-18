export function cache(name: string, debug = false) {
  const storage: Record<string, any> = {};
  const log = debug ? console.debug : new Function();
  const get = async (key: string, setter: (key: string) => Promise<any>) => {
    if (key in storage) {
      log(`${name} ${key} HIT`);
    } else {
      log(`${name} ${key} MISS`);
      storage[key] = await setter(key);
    }
    return storage[key];
  };

  return {
    storage,
    get,
  };
}
