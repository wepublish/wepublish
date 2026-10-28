export const definedOnly = <T extends object>(overrides: T): T => {
  const result = { ...overrides };

  for (const key of Object.keys(result) as Array<keyof T>) {
    if (result[key] === undefined) {
      delete result[key];
    }
  }

  return result;
};
