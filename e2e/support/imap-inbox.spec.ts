import { beforeEach, describe, expect, it, vi } from 'vitest';

const imap = vi.hoisted(() => ({
  messageDelete: vi.fn(async () => true),
}));

vi.mock('imapflow', () => ({
  ImapFlow: class {
    connect = vi.fn(async () => undefined);
    getMailboxLock = vi.fn(async () => ({ release: () => undefined }));
    noop = vi.fn(async () => undefined);
    search = vi.fn(async () => [7]);
    fetch = async function* () {
      yield {
        uid: 7,
        envelope: { subject: 'Rechnung', to: [{ address: 'reader@example.test' }] },
        internalDate: new Date(),
      };
    };
    fetchOne = vi.fn(async () => ({ source: Buffer.from('mail') }));
    messageDelete = imap.messageDelete;
    logout = vi.fn(async () => undefined);
  },
}));

vi.mock('mailparser', () => ({
  simpleParser: vi.fn(async () => ({
    subject: 'Rechnung',
    to: { value: [{ address: 'reader@example.test' }] },
    html: '',
    text: '',
    attachments: [],
  })),
}));

const { ImapInbox } = await import('./imap-inbox');

const config = { host: 'h', port: 993, user: 'u', password: 'p' };
const since = new Date(0);

describe('ImapInbox.waitForMail', () => {
  beforeEach(() => imap.messageDelete.mockClear());

  it('deletes the mail it read, keeping the shared mailbox small', async () => {
    const inbox = new ImapInbox(config, since);

    await inbox.waitForMail({ to: 'reader@example.test' });

    expect(imap.messageDelete).toHaveBeenCalledWith('7', { uid: true });
  });

  it('leaves the mail in the mailbox when asked to keep mails, so people can look at it', async () => {
    const inbox = new ImapInbox(config, since, { keepMails: true });

    const mail = await inbox.waitForMail({ to: 'reader@example.test' });

    expect(mail.subject).toBe('Rechnung');
    expect(imap.messageDelete).not.toHaveBeenCalled();
  });
});

describe('ImapInbox.sweep', () => {
  beforeEach(() => imap.messageDelete.mockClear());

  it('counts and deletes the mails to a group of recipients, keeping the mailbox under its quota', async () => {
    const inbox = new ImapInbox(config, since);

    await expect(inbox.sweep({ toContaining: 'reader@', keep: [] })).resolves.toBe(1);
    expect(imap.messageDelete).toHaveBeenCalledWith([7], { uid: true });
  });

  it('leaves the mails a later step still reads', async () => {
    const inbox = new ImapInbox(config, since);

    await expect(
      inbox.sweep({ toContaining: 'reader@', keep: ['Reader@example.test'] })
    ).resolves.toBe(0);
    expect(imap.messageDelete).not.toHaveBeenCalled();
  });

  it('only counts when asked to keep mails', async () => {
    const inbox = new ImapInbox(config, since, { keepMails: true });

    await expect(inbox.sweep({ toContaining: 'reader@', keep: [] })).resolves.toBe(1);
    expect(imap.messageDelete).not.toHaveBeenCalled();
  });
});
