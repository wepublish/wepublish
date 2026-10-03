export default async () => {
  process.env['TZ'] = 'UTC';

  // Anything reading a stored provider credential constructs SecretCrypto,
  // which refuses to boot without a master key.
  process.env['APP_SECRET_KEY'] ??= 'test-app-secret-key-0123456789';

  // nx loads .env into every task; tests must not share the dev Dragonfly.
  delete process.env['REDIS_URL'];
  delete process.env['REDIS_KEY_PREFIX'];
};
