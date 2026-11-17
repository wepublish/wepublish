import {
  MailChannel,
  MailTemplateContext,
  MailTemplateVariantFragment,
  MailTemplateVariantInput,
} from '@wepublish/editor/api';

import { createEmptyEmailHtml } from './mail-html';

/** What the edit form holds for one channel of a template. */
export type VersionDraft = {
  subject: string;
  html: string;
  letterLayoutId: string | null;
  letterAppendixId: string | null;
};

export type VersionDrafts = Partial<Record<MailChannel, VersionDraft>>;

/** The email first: it is what a person gets without a decision of their own. */
export const VERSION_ORDER = [MailChannel.Mail, MailChannel.Letter];

/** The templates a send on this channel can use. */
export const templatesForChannel = <T extends { channels: MailChannel[] }>(
  templates: readonly T[],
  channel: MailChannel
): T[] => templates.filter(template => template.channels.includes(channel));

/**
 * The account mails carry a login link and go out the moment someone asks for
 * them, so the api refuses a letter version for these purposes.
 */
const EMAIL_ONLY_CONTEXTS: MailTemplateContext[] = [
  MailTemplateContext.Account,
  MailTemplateContext.EmailChange,
];

export const allowsLetterVersion = (
  context: MailTemplateContext | null | undefined
): boolean => !context || !EMAIL_ONLY_CONTEXTS.includes(context);

export const draftsFromVariants = (
  variants: readonly MailTemplateVariantFragment[]
): VersionDrafts =>
  Object.fromEntries(
    variants.map(variant => [
      variant.channel,
      {
        subject: variant.subject,
        html: variant.htmlContent || createEmptyEmailHtml(),
        letterLayoutId: variant.letterLayoutId ?? null,
        letterAppendixId: variant.letterAppendixId ?? null,
      },
    ])
  );

/**
 * A version added in the form starts as a copy of the one being looked at, so
 * the author adapts a text instead of retyping it. Stationery is not copied:
 * it is the letter's alone.
 */
export const newVersionDraft = (copyFrom?: VersionDraft): VersionDraft => ({
  subject: copyFrom?.subject ?? '',
  html: copyFrom?.html ?? createEmptyEmailHtml(),
  letterLayoutId: null,
  letterAppendixId: null,
});

/** The versions to save, in the shape the api takes them. */
export const variantInputs = (
  drafts: VersionDrafts,
  toText: (html: string) => string
): MailTemplateVariantInput[] =>
  VERSION_ORDER.flatMap(channel => {
    const draft = drafts[channel];

    if (!draft) {
      return [];
    }

    return channel === MailChannel.Letter ?
        {
          channel,
          subject: draft.subject,
          htmlContent: draft.html,
          letterLayoutId: draft.letterLayoutId,
          letterAppendixId: draft.letterAppendixId,
        }
        // The text alternative is always regenerated from the HTML on save.
      : {
          channel,
          subject: draft.subject,
          htmlContent: draft.html,
          textContent: toText(draft.html),
        };
  });

/**
 * Saving never removes a version by leaving it out, so the ones taken away in
 * the form have to be deleted one by one.
 */
export const removedChannels = (
  saved: readonly MailChannel[],
  drafts: VersionDrafts
): MailChannel[] => saved.filter(channel => !drafts[channel]);

/**
 * The channel a send of this template goes out on: the chosen one while the
 * template is written for it, otherwise one it has. Null when the medium can
 * send on none of the template's channels.
 */
export const sendChannelFor = (
  templateChannels: readonly MailChannel[],
  chosen: MailChannel,
  sendable: readonly MailChannel[]
): MailChannel | null => {
  const usable = VERSION_ORDER.filter(
    channel => templateChannels.includes(channel) && sendable.includes(channel)
  );

  return usable.includes(chosen) ? chosen : (usable[0] ?? null);
};
