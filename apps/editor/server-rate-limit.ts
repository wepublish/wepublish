function readPositiveIntegerFromEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  const parsedValue = rawValue ? Number(rawValue) : fallback;

  return Number.isInteger(parsedValue) && parsedValue > 0 ?
      parsedValue
    : fallback;
}

export function getEditorRateLimitOptions() {
  return {
    windowMs: readPositiveIntegerFromEnv('EDITOR_RATE_LIMIT_WINDOW_MS', 60_000),
    limit: readPositiveIntegerFromEnv('EDITOR_RATE_LIMIT_MAX', 600),
    standardHeaders: true,
    legacyHeaders: false,
  };
}
