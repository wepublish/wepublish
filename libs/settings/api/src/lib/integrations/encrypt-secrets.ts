/**
 * Encrypts the secrets of a settings input before they are stored.
 *
 * The editor never shows a stored secret, so a field left empty arrives as
 * `''` and means "keep it": it is dropped rather than written over the stored
 * value. `null` still clears it on purpose.
 */
export function encryptSecrets<T extends object, K extends keyof T>(
  data: T,
  keys: readonly K[],
  encrypt: (value: string) => string
): T {
  const result = { ...data };

  for (const key of keys) {
    const value = data[key];

    if (value === '') {
      delete result[key];
    } else if (typeof value === 'string') {
      result[key] = encrypt(value) as T[K];
    }
  }

  return result;
}
