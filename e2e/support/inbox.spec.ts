import { simpleParser } from 'mailparser';
import { describe, expect, it } from 'vitest';
import { extractLink, mailBackend, type Mail } from './inbox';
import { pickMessage, toMail } from './imap-inbox';

const mail = (over: Partial<Mail> = {}): Mail => ({
  id: '1',
  subject: 'Login',
  to: ['reader@example.test'],
  html: '',
  text: '',
  attachments: [],
  ...over,
});

describe('toMail', () => {
  const pdf = Buffer.from('%PDF-1.4 invoice');
  const source = [
    'From: abo@site.test',
    'To: reader@example.test',
    'Subject: Ihre Rechnung',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="b"',
    '',
    '--b',
    'Content-Type: text/plain; charset=utf-8',
    '',
    'Im Anhang Ihre Rechnung.',
    '--b',
    'Content-Type: application/pdf; name="RE-11.pdf"',
    'Content-Disposition: attachment; filename="RE-11.pdf"',
    'Content-Transfer-Encoding: base64',
    '',
    pdf.toString('base64'),
    '--b--',
    '',
  ].join('\r\n');

  it('keeps the attachments of the mail with their content', async () => {
    const parsed = toMail('7', await simpleParser(source));

    expect(parsed).toMatchObject({ id: '7', subject: 'Ihre Rechnung', to: ['reader@example.test'] });
    expect(parsed.attachments).toEqual([
      { filename: 'RE-11.pdf', contentType: 'application/pdf', content: pdf },
    ]);
  });
});

describe('mailBackend', () => {
  it('prefers mailpit when both are configured', () => {
    expect(
      mailBackend({ mailpitUrl: 'http://localhost:8025', imap: { host: 'h', port: 993, user: 'u', password: 'p' } })
    ).toBe('mailpit');
  });

  it('uses imap when only imap credentials are set', () => {
    expect(mailBackend({ imap: { host: 'h', port: 993, user: 'u', password: 'p' } })).toBe('imap');
  });

  it('has none without configuration', () => {
    expect(mailBackend({})).toBeUndefined();
  });
});

describe('extractLink', () => {
  it('finds a link in the html, unescaping ampersands', () => {
    const html = '<a href="https://site.test/login?jwt=abc&amp;next=%2F">Login</a>';

    expect(extractLink(mail({ html }), /\/login\?jwt=/)).toBe('https://site.test/login?jwt=abc&next=%2F');
  });

  it('falls back to links in the text part', () => {
    expect(extractLink(mail({ text: 'Open https://site.test/login?jwt=xyz now' }), /jwt=/)).toBe(
      'https://site.test/login?jwt=xyz'
    );
  });

  it('names the mail and the links it saw when nothing matches', () => {
    expect(() => extractLink(mail({ text: 'https://site.test/other' }), /jwt=/)).toThrow(
      /No link matching .* in mail "Login"\. Links: https:\/\/site\.test\/other/
    );
  });
});

describe('pickMessage', () => {
  const since = new Date('2026-10-30T10:00:00Z');
  const candidate = (uid: number, over: Partial<Parameters<typeof pickMessage>[0][number]> = {}) => ({
    uid,
    subject: 'Login',
    to: ['reader@example.test'],
    received: new Date('2026-10-30T10:00:05Z'),
    ...over,
  });

  it('takes the newest mail to the recipient', () => {
    expect(pickMessage([candidate(1), candidate(2)], { to: 'reader@example.test', since })).toBe(2);
  });

  it('matches the recipient exactly, ignoring case', () => {
    const others = [candidate(1, { to: ['other+reader@example.test'] }), candidate(2, { to: ['Reader@Example.test'] })];

    expect(pickMessage(others, { to: 'reader@example.test', since })).toBe(2);
  });

  it('ignores mails received before the scenario started', () => {
    expect(
      pickMessage([candidate(1, { received: new Date('2026-10-30T09:59:59Z') })], { to: 'reader@example.test', since })
    ).toBeUndefined();
  });

  it('filters by subject when asked', () => {
    const mails = [candidate(1, { subject: 'Rechnung' }), candidate(2, { subject: 'Login' })];

    expect(pickMessage(mails, { to: 'reader@example.test', subject: /Rechnung/, since })).toBe(1);
  });
});
