import {
  scrubBreadcrumb,
  scrubEvent,
  scrubLoginSecrets,
  scrubRecordingEvent,
} from './sentryScrub';

const GRANT = 'eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ1In0.c2lnbmF0dXJl';

describe('scrubbing login secrets before they reach Sentry', () => {
  it.each([
    [`/login/impersonate/${GRANT}`, '/login/impersonate/[redacted]'],
    [
      `https://editor.medium.ch/login/jwt/${GRANT}?x=1`,
      'https://editor.medium.ch/login/jwt/[redacted]?x=1',
    ],
    [
      'https://editor.medium.ch/login/support#code=grant&state=s',
      'https://editor.medium.ch/login/support',
    ],
    ['/articles/edit/123', '/articles/edit/123'],
  ])('turns %s into %s', (value, scrubbed) => {
    expect(scrubLoginSecrets(value)).toBe(scrubbed);
  });

  it('scrubs the transaction name and the request url of an event', () => {
    expect(
      scrubEvent({
        transaction: `/login/impersonate/${GRANT}`,
        request: { url: `https://editor.medium.ch/login/jwt/${GRANT}` },
      })
    ).toEqual({
      transaction: '/login/impersonate/[redacted]',
      request: { url: 'https://editor.medium.ch/login/jwt/[redacted]' },
    });
  });

  it('scrubs navigation breadcrumbs', () => {
    expect(
      scrubBreadcrumb({
        category: 'navigation',
        data: { from: `/login/impersonate/${GRANT}`, to: '/' },
      })
    ).toEqual({
      category: 'navigation',
      data: { from: '/login/impersonate/[redacted]', to: '/' },
    });
  });

  it('scrubs the address a replay records', () => {
    expect(
      scrubRecordingEvent({
        type: 4,
        data: { href: `https://editor.medium.ch/login/jwt/${GRANT}` },
      })
    ).toEqual({
      type: 4,
      data: { href: 'https://editor.medium.ch/login/jwt/[redacted]' },
    });
  });
});
