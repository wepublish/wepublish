import {
  scrubBreadcrumb,
  scrubEvent,
  scrubLoginSecrets,
  scrubRecordingEvent,
} from './sentryScrub';

const GRANT = 'eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ1In0.c2lnbmF0dXJl';

describe('scrubbing login secrets before they reach Sentry', () => {
  it.each([
    [`/login/jwt/${GRANT}`, '/login/jwt/[redacted]'],
    [
      `https://editor.medium.ch/login/jwt/${GRANT}?x=1`,
      'https://editor.medium.ch/login/jwt/[redacted]?x=1',
    ],
    [
      'https://editor.medium.ch/login/wepublish#code=the-code&state=s',
      'https://editor.medium.ch/login/wepublish',
    ],
    ['/articles/edit/123', '/articles/edit/123'],
  ])('turns %s into %s', (value, scrubbed) => {
    expect(scrubLoginSecrets(value)).toBe(scrubbed);
  });

  it('scrubs the transaction name and the request url of an event', () => {
    expect(
      scrubEvent({
        transaction: `/login/jwt/${GRANT}`,
        request: { url: `https://editor.medium.ch/login/jwt/${GRANT}` },
      })
    ).toEqual({
      transaction: '/login/jwt/[redacted]',
      request: { url: 'https://editor.medium.ch/login/jwt/[redacted]' },
    });
  });

  it('scrubs navigation breadcrumbs', () => {
    expect(
      scrubBreadcrumb({
        category: 'navigation',
        data: { from: `/login/jwt/${GRANT}`, to: '/' },
      })
    ).toEqual({
      category: 'navigation',
      data: { from: '/login/jwt/[redacted]', to: '/' },
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
