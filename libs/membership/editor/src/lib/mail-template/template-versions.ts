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
  /**
   * Letter only: the letter says what the email says. Its own subject and
   * body are not used then, and not saved.
   */
  sameAsMail: boolean;
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
        sameAsMail: !!variant.sameAsMail,
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
  sameAsMail: false,
  letterLayoutId: null,
  letterAppendixId: null,
});

/**
 * A letter that says what the email says: the default, so there is one text
 * to maintain until the letter needs its own.
 */
export const sharedLetterDraft = (): VersionDraft => ({
  ...newVersionDraft(),
  sameAsMail: true,
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
          // No copy of the email is kept, so the two cannot drift apart.
          subject: draft.sameAsMail ? '' : draft.subject,
          htmlContent: draft.sameAsMail ? '' : draft.html,
          sameAsMail: draft.sameAsMail,
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
