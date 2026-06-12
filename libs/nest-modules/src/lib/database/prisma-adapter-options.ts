const DEFAULT_CONNECTION_STRING = 'postgresql://';
const DEFAULT_POOL_SIZE = 2;
const DEFAULT_CONNECTION_TIMEOUT_MS = 5_000;
const DEFAULT_IDLE_TIMEOUT_MS = 10_000;

export interface PrismaPgAdapterOptions {
  connectionString: string;
  max: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  if (!value || !/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return parsed > 0 ? parsed : fallback;
}

export function getPrismaPgAdapterOptions(
  env: NodeJS.ProcessEnv = process.env
): PrismaPgAdapterOptions {
  return {
    connectionString: env['DATABASE_URL'] || DEFAULT_CONNECTION_STRING,
    max: parsePositiveInteger(env['DATABASE_POOL_SIZE'], DEFAULT_POOL_SIZE),
    connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT_MS,
  };
}
