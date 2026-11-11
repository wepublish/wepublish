export const createConcurrencyLimit = (max: number) => {
  let running = 0;
  const waiting: Array<() => void> = [];

  return async <T>(task: () => Promise<T>): Promise<T> => {
    while (running >= max) {
      await new Promise<void>(resolve => waiting.push(resolve));
    }

    running++;
    try {
      return await task();
    } finally {
      running--;
      waiting.shift()?.();
    }
  };
};
