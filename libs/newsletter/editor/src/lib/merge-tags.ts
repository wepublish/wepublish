import type { ApolloClient } from '@apollo/client';
import {
  NewsletterMergeFieldsDocument,
  NewsletterMergeFieldsQuery,
} from '@wepublish/editor/api';
import type { InterestCategory, MergeTag } from '@wepublish/newsletter';
import { SYSTEM_MERGE_TAGS } from '@wepublish/newsletter';
import type { TFunction } from 'i18next';

export type { InterestCategory, MergeTag };

export interface MergeTagGroup {
  name: string;
  tags: MergeTag[];
}

/**
 * What the prose picker and the condition row offer. The system tags are
 * bundled and translated here; the audience's own fields and interest
 * categories are fetched once per editor session.
 */
export interface MergeTagCatalogue {
  groups: MergeTagGroup[];
  fields: MergeTag[];
  interests: InterestCategory[];
  error?: string;
}

let loaded: Promise<MergeTagCatalogue> | undefined;

export function systemMergeTags(t: TFunction): MergeTag[] {
  return SYSTEM_MERGE_TAGS.map(tag => ({
    tag: tag.tag,
    kind: tag.kind,
    label: t(`newsletter.mergeTags.${tag.key}.label`),
    description: t(`newsletter.mergeTags.${tag.key}.description`),
  }));
}

function catalogue(
  t: TFunction,
  fields: MergeTag[],
  interests: InterestCategory[],
  error?: string
): MergeTagCatalogue {
  return {
    groups: [
      {
        name: t('newsletter.mergeTags.groups.system'),
        tags: systemMergeTags(t),
      },
      ...(fields.length ?
        [{ name: t('newsletter.mergeTags.groups.fields'), tags: fields }]
      : []),
    ],
    fields,
    interests,
    error,
  };
}

/**
 * A result that is missing the account's fields is not cached: the reason is
 * usually Mailchimp being briefly unreachable, and the next picker to open is
 * exactly when another try is worth it.
 */
export function loadMergeTags(
  client: ApolloClient<unknown>,
  t: TFunction
): Promise<MergeTagCatalogue> {
  loaded ??= client
    .query<NewsletterMergeFieldsQuery>({
      query: NewsletterMergeFieldsDocument,
      fetchPolicy: 'network-only',
    })
    .then(({ data }) => {
      const payload = data.newsletterMergeFields;

      if (payload.error) {
        loaded = undefined;
      }

      return catalogue(
        t,
        payload.fields.map(field => ({
          tag: field.tag,
          label: field.name,
          description: t('newsletter.mergeTags.audienceField', {
            tag: field.tag.replace(/^\*\|/, '').replace(/\|\*$/, ''),
          }),
        })),
        payload.interests.map(category => ({
          title: category.title,
          groups: category.groups,
        })),
        payload.error ?? undefined
      );
    })
    .catch((cause: Error) => {
      loaded = undefined;

      return catalogue(t, [], [], cause.message);
    });

  return loaded;
}

export function resetMergeTags(): void {
  loaded = undefined;
}

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
