const SECRET_FIELD = /api_?key|secret|private_?key|password|token|credential/i;

const isPublicBypassToken = (path: string[], key: string) =>
  key === 'token' && path.at(-2) === 'bypasses';

const findSecretFieldAt = (
  value: unknown,
  path: string[]
): string | undefined => {
  if (value === null || typeof value !== 'object' || value instanceof Date) {
    return undefined;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = [...path, key];

    if (
      !Array.isArray(value) &&
      SECRET_FIELD.test(key) &&
      child !== null &&
      child !== undefined &&
      child !== '' &&
      !isPublicBypassToken(path, key)
    ) {
      return childPath.join('.');
    }

    const found = findSecretFieldAt(child, childPath);

    if (found) {
      return found;
    }
  }

  return undefined;
};

export function findSecretField(value: unknown): string | undefined {
  return findSecretFieldAt(value, []);
}
