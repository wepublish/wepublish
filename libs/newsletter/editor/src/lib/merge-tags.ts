/**
 * What the prose fields and the dynamic-content row offer, from three places on
 * purpose.
 *
 * Mailchimp's *system* tags are a constant this bundle carries — they are the
 * same for every account, so asking a server for them would only add a way for
 * the picker to come up empty. The *audience's* merge fields are the columns of
 * that account's contact table, and its *interest categories* are the groups its
 * contacts are filed into; both belong to the account and have to be fetched.
 * `newsletterMergeFields` answers with both, or with a note saying why one of
 * them is missing.
 *
 * Fetched on demand rather than with the editor, and once per page however many
 * fields ask: the article list is already on the critical path and this does not
 * need to be. Which demand comes first differs by field — a prose picker asks
 * when it is opened, the condition row when a block is selected, because a
 * `<select>` needs its options before it can be opened.
 */
import {
  getApiClientV2,
  NewsletterMergeFieldsDocument,
  NewsletterMergeFieldsQuery,
} from '@wepublish/editor/api';
import type { InterestCategory, MergeTag } from '@wepublish/newsletter/email';
import { SYSTEM_MERGE_TAGS } from '@wepublish/newsletter/email';

export type { InterestCategory, MergeTag };

export interface MergeTagGroup {
  /** A translation key. */
  name: string;
  tags: MergeTag[];
}

export interface MergeTagCatalogue {
  /**
   * The prose picker's list: Mailchimp's system tags and the contact fields, in
   * the order and grouping the picker shows them.
   */
  groups: MergeTagGroup[];
  /**
   * The audience's own contact fields, on their own as well as inside `groups`.
   *
   * The condition row wants these *without* the system tags beside them, and
   * asking for them by group name would tie it to how the picker happens to
   * label its sections. Two readers with different needs, one fetch.
   */
  fields: MergeTag[];
  /**
   * The audience's interest categories — Mailchimp's *groups*.
   *
   * Beside `groups` rather than as a third entry in it, and the distinction is
   * load-bearing: a category is not an insertable tag, so the prose picker must
   * never list one. It walks `groups` and inserts whatever it finds, and a
   * `*|INTERESTED:…|*` dropped into a paragraph would leave the sent mail with
   * an unbalanced conditional. Only the condition row reads this, where it sits
   * in its own `<optgroup>` under the contact fields.
   */
  interests: InterestCategory[];
  /** Why the contact fields or the groups are absent, if they are. */
  error?: string;
}

let loaded: Promise<MergeTagCatalogue> | undefined;

const catalogue = (
  fields: MergeTag[],
  interests: InterestCategory[],
  error?: string
): MergeTagCatalogue => ({
  groups: [
    { name: 'newsletter.mergeTags.system', tags: SYSTEM_MERGE_TAGS },
    ...(fields.length ?
      [{ name: 'newsletter.mergeTags.fields', tags: fields }]
    : []),
  ],
  fields,
  interests,
  error,
});

export function loadMergeTags(): Promise<MergeTagCatalogue> {
  loaded ??= getApiClientV2()
    .query<NewsletterMergeFieldsQuery>({ query: NewsletterMergeFieldsDocument })
    .then(({ data }) => {
      const payload = data.newsletterMergeFields;

      // A result that is missing the contact fields or the groups is not cached:
      // the reason is usually Mailchimp being briefly unreachable, and the next
      // time a picker opens is exactly when it is worth another try.
      if (payload.error) {
        loaded = undefined;
      }

      const fields: MergeTag[] = payload.fields.map(field => ({
        tag: field.tag,
        label: field.label,
        description: field.description,
        kind: field.kind === 'url' ? 'url' : undefined,
      }));

      return catalogue(fields, payload.interests, payload.error ?? undefined);
    })
    .catch((cause: Error) => {
      loaded = undefined;

      // Resolves rather than rejects: the system tags are bundled and are the
      // ones an editor reaches for, so losing the whole picker because the
      // account's own fields could not be fetched would be the wrong trade.
      return catalogue([], [], cause.message);
    });

  return loaded;
}

/** Free-text search over the label, the tag itself and its description. */
export function filterTags(
  groups: MergeTagGroup[],
  query: string
): MergeTagGroup[] {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return groups;
  }

  return groups
    .map(group => ({
      name: group.name,
      tags: group.tags.filter(tag =>
        `${tag.label} ${tag.tag} ${tag.description}`
          .toLowerCase()
          .includes(needle)
      ),
    }))
    .filter(group => group.tags.length > 0);
}
