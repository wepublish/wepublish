import { MailChannel, MailTemplateContext } from '@wepublish/editor/api';

import {
  allowsLetterVersion,
  draftsFromVariants,
  newVersionDraft,
  removedChannels,
  sendChannelFor,
  templatesForChannel,
  variantInputs,
} from './template-versions';

const variant = (channel: MailChannel, over = {}) => ({
  id: `v-${channel}`,
  channel,
  subject: `Subject ${channel}`,
  htmlContent: `<p>${channel}</p>`,
  textContent: null,
  letterLayoutId: null,
  letterAppendixId: null,
  ...over,
});

describe('templatesForChannel', () => {
  const templates = [
    { id: 'both', channels: [MailChannel.Mail, MailChannel.Letter] },
    { id: 'mail', channels: [MailChannel.Mail] },
    { id: 'letter', channels: [MailChannel.Letter] },
  ];

  it('offers only the templates written for the channel', () => {
    expect(
      templatesForChannel(templates, MailChannel.Mail).map(({ id }) => id)
    ).toEqual(['both', 'mail']);
    expect(
      templatesForChannel(templates, MailChannel.Letter).map(({ id }) => id)
    ).toEqual(['both', 'letter']);
  });
});

describe('allowsLetterVersion', () => {
  it('refuses a letter for the account mails, which carry a login link', () => {
    expect(allowsLetterVersion(MailTemplateContext.Account)).toBe(false);
    expect(allowsLetterVersion(MailTemplateContext.EmailChange)).toBe(false);
  });

  it('allows a letter for every other purpose, and before one is chosen', () => {
    expect(allowsLetterVersion(MailTemplateContext.Custom)).toBe(true);
    expect(allowsLetterVersion(null)).toBe(true);
  });
});

describe('draftsFromVariants', () => {
  it('keys the saved versions by channel', () => {
    const drafts = draftsFromVariants([
      variant(MailChannel.Mail),
      variant(MailChannel.Letter, {
        letterLayoutId: 'layout-1',
        letterAppendixId: 'doc-1',
      }),
    ]);

    expect(drafts[MailChannel.Mail]).toEqual({
      subject: 'Subject mail',
      html: '<p>mail</p>',
      letterLayoutId: null,
      letterAppendixId: null,
    });
    expect(drafts[MailChannel.Letter]).toMatchObject({
      letterLayoutId: 'layout-1',
      letterAppendixId: 'doc-1',
    });
  });

  it('leaves out a channel the template is not written for', () => {
    expect(
      draftsFromVariants([variant(MailChannel.Mail)])[MailChannel.Letter]
    ).toBeUndefined();
  });
});

describe('newVersionDraft', () => {
  it('starts a new version from the one being copied', () => {
    expect(
      newVersionDraft({
        subject: 'Hello',
        html: '<p>Hi</p>',
        letterLayoutId: 'layout-1',
        letterAppendixId: 'doc-1',
      })
    ).toEqual({
      subject: 'Hello',
      html: '<p>Hi</p>',
      letterLayoutId: null,
      letterAppendixId: null,
    });
  });

  it('starts empty without one to copy', () => {
    const draft = newVersionDraft();

    expect(draft.subject).toBe('');
    expect(draft.html).toContain('<html');
  });
});

describe('variantInputs', () => {
  const toText = (html: string) => `text of ${html}`;

  it('sends the email first, with its plain text and no stationery', () => {
    const inputs = variantInputs(
      {
        [MailChannel.Letter]: {
          subject: 'L',
          html: '<p>l</p>',
          letterLayoutId: 'layout-1',
          letterAppendixId: 'doc-1',
        },
        [MailChannel.Mail]: {
          subject: 'M',
          html: '<p>m</p>',
          letterLayoutId: 'stale',
          letterAppendixId: 'stale',
        },
      },
      toText
    );

    expect(inputs).toEqual([
      {
        channel: MailChannel.Mail,
        subject: 'M',
        htmlContent: '<p>m</p>',
        textContent: 'text of <p>m</p>',
      },
      {
        channel: MailChannel.Letter,
        subject: 'L',
        htmlContent: '<p>l</p>',
        letterLayoutId: 'layout-1',
        letterAppendixId: 'doc-1',
      },
    ]);
  });

  it('sends only the versions that exist', () => {
    expect(
      variantInputs(
        {
          [MailChannel.Letter]: {
            subject: 'L',
            html: '',
            letterLayoutId: null,
            letterAppendixId: null,
          },
        },
        toText
      ).map(({ channel }) => channel)
    ).toEqual([MailChannel.Letter]);
  });
});

describe('removedChannels', () => {
  it('names the saved versions the form no longer has', () => {
    expect(
      removedChannels([MailChannel.Mail, MailChannel.Letter], {
        [MailChannel.Mail]: newVersionDraft(),
      })
    ).toEqual([MailChannel.Letter]);
  });

  it('names nothing while every saved version is still there', () => {
    expect(
      removedChannels([MailChannel.Mail], {
        [MailChannel.Mail]: newVersionDraft(),
        [MailChannel.Letter]: newVersionDraft(),
      })
    ).toEqual([]);
  });
});

describe('sendChannelFor', () => {
  const both = [MailChannel.Mail, MailChannel.Letter];

  it('keeps the chosen channel while the template is written for it', () => {
    expect(sendChannelFor(both, MailChannel.Letter, both)).toBe(
      MailChannel.Letter
    );
  });

  it('moves to a channel the template has', () => {
    expect(sendChannelFor([MailChannel.Mail], MailChannel.Letter, both)).toBe(
      MailChannel.Mail
    );
    expect(sendChannelFor([MailChannel.Letter], MailChannel.Mail, both)).toBe(
      MailChannel.Letter
    );
  });

  it('never moves to a channel the medium cannot send on', () => {
    expect(sendChannelFor(both, MailChannel.Letter, [MailChannel.Mail])).toBe(
      MailChannel.Mail
    );
    expect(
      sendChannelFor([MailChannel.Letter], MailChannel.Mail, [MailChannel.Mail])
    ).toBeNull();
  });
});
