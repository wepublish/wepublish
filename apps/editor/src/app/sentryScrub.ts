const SECRET_PATH = /\/login\/(impersonate|jwt)\/[^/?#\s]+/g;
const SUPPORT_LOGIN_FRAGMENT = /(\/login\/support)#[^\s]*/g;

export function scrubLoginSecrets(value: string): string {
  return value
    .replace(SECRET_PATH, '/login/$1/[redacted]')
    .replace(SUPPORT_LOGIN_FRAGMENT, '$1');
}

const scrubbed = <T>(value: T): T =>
  typeof value === 'string' ? (scrubLoginSecrets(value) as T) : value;

export function scrubEvent<
  T extends { transaction?: string; request?: { url?: string } },
>(event: T): T {
  if (event.transaction) {
    event.transaction = scrubbed(event.transaction);
  }

  if (event.request?.url) {
    event.request.url = scrubbed(event.request.url);
  }

  return event;
}

export function scrubBreadcrumb<T extends { data?: Record<string, unknown> }>(
  breadcrumb: T
): T {
  for (const key of ['from', 'to', 'url']) {
    if (breadcrumb.data && key in breadcrumb.data) {
      breadcrumb.data[key] = scrubbed(breadcrumb.data[key]);
    }
  }

  return breadcrumb;
}

export function scrubRecordingEvent<
  T extends { data?: Record<string, unknown> | unknown },
>(event: T): T {
  const data = event.data as Record<string, unknown> | undefined;

  if (data && typeof data === 'object' && typeof data['href'] === 'string') {
    data['href'] = scrubLoginSecrets(data['href']);
  }

  return event;
}
