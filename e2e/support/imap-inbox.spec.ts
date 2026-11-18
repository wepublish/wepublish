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
