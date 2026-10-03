export const restoreFastStringPrototype = () => {
  const probe = Object.setPrototypeOf({}, String.prototype) as {
    charCodeAt?: unknown;
  };
  let found = 0;

  for (let i = 0; i < 1000; i++) {
    if (probe.charCodeAt) {
      found++;
    }
  }

  return found;
};
