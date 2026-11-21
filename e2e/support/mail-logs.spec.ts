import { describe, expect, it } from 'vitest';
import { newestLogSince, type MailLog } from './mail-logs';

const log = (id: string, sentDate: string, over: Partial<MailLog> = {}): MailLog => ({
  id,
  channel: 'letter',
  state: 'submitted',
  sentDate,
  address: 'Lea Muster, Teststrasse 1, 8000 Zürich, CH',
  providerLetterID: `pingen-${id}`,
  error: null,
  ...over,
});

describe('newestLogSince', () => {
  const since = new Date('2026-11-16T10:00:00Z');

  it('takes the newest entry sent after the scenario started', () => {
    const logs = [log('a', '2026-11-16T10:00:01Z'), log('b', '2026-11-16T10:00:09Z')];

    expect(newestLogSince(logs, since)?.id).toBe('b');
  });

  it('ignores entries from before the scenario', () => {
    expect(newestLogSince([log('old', '2026-11-16T09:59:59Z')], since)).toBeUndefined();
  });
});
