/**
 * Mailchimp's merge tags. A merge tag is plain text to everything in this
 * library: the renderer emits `*|FNAME|*` as those characters and Mailchimp
 * substitutes them in the uploaded HTML. Nothing here resolves one.
 *
 * Source: https://mailchimp.com/help/customize-your-footer-content/
 */

export interface MergeTag {
  tag: string;
  label: string;
  description: string;
  /**
   * A tag that expands to an address and nothing else. The editor inserts
   * these as a link target, never as text.
   */
  kind?: 'url';
}

/**
 * A system tag as the library knows it. Its label and description are i18n
 * keys under `newsletter.mergeTags.<key>`, translated by the editor.
 */
export interface SystemMergeTag {
  tag: string;
  key: string;
  kind?: 'url';
}

/** The tags Mailchimp's footer help page documents, required ones first. */
export const SYSTEM_MERGE_TAGS: SystemMergeTag[] = [
  { tag: '*|UNSUB|*', key: 'unsub', kind: 'url' },
  { tag: '*|HTML:LIST_ADDRESS_HTML|*', key: 'listAddressHtml' },
  { tag: '*|LIST:ADDRESS|*', key: 'listAddress' },
  { tag: '*|LIST:ADDRESSLINE|*', key: 'listAddressLine' },
  { tag: '*|REWARDS|*', key: 'rewards' },
  { tag: '*|UPDATE_PROFILE|*', key: 'updateProfile', kind: 'url' },
  { tag: '*|ARCHIVE|*', key: 'archive', kind: 'url' },
  { tag: '*|FORWARD|*', key: 'forward', kind: 'url' },
  { tag: '*|LIST:SUBSCRIBE|*', key: 'listSubscribe', kind: 'url' },
  { tag: '*|ABOUT_LIST|*', key: 'aboutList', kind: 'url' },
  { tag: '*|LIST:URL|*', key: 'listUrl', kind: 'url' },
  {
    tag: '*|LIST:ADDRESS_VCARD_HREF|*',
    key: 'listAddressVcardHref',
    kind: 'url',
  },
  { tag: '*|LIST:ADDRESS_VCARD|*', key: 'listAddressVcard' },
  { tag: '*|LIST:DESCRIPTION|*', key: 'listDescription' },
  { tag: '*|LIST:COMPANY|*', key: 'listCompany' },
  { tag: '*|LIST:NAME|*', key: 'listName' },
  { tag: '*|LIST:PHONE|*', key: 'listPhone' },
  { tag: '*|LIST:UID|*', key: 'listUid' },
  { tag: '*|ABUSE_EMAIL|*', key: 'abuseEmail' },
  { tag: '*|EMAIL|*', key: 'email' },
  { tag: '*|CURRENT_YEAR|*', key: 'currentYear' },
];

export const isSystemMergeTag = (tag: string): boolean =>
  SYSTEM_MERGE_TAGS.some(known => known.tag === tag);

/**
 * The part of a tag between the delimiters. Digits and the colon are in it
 * because `*|LIST:SUBSCRIBE|*` is a link target and would otherwise be
 * rejected as a malformed URL.
 */
export const MERGE_TAG_NAME_SOURCE = '[A-Z0-9_:]+';

export const MERGE_TAG_SOURCE = `\\*\\|${MERGE_TAG_NAME_SOURCE}\\|\\*`;

/**
 * A merge tag as an `href`. Anchored at both ends, so nothing matching it can
 * be a `javascript:` URL.
 */
export const MERGE_TAG_HREF = new RegExp(`^${MERGE_TAG_SOURCE}$`);

export const MERGE_TAG_NAME = new RegExp(`^${MERGE_TAG_NAME_SOURCE}$`);

export const mergeTagName = (tag: string): string =>
  tag.trim().replace(/^\*\|/, '').replace(/\|\*$/, '');

export type MergeComparison = 'is' | 'not';

/**
 * A merge field is compared inside an `IF`; a group (interest category plus
 * group name) has a conditional tag of its own, `INTERESTED`, and cannot be
 * squeezed into the `IF` form.
 */
export type MergeConditionKind = 'field' | 'interest';

export interface MergeCondition {
  kind?: MergeConditionKind;
  field: string;
  operator: MergeComparison;
  value: string;
}

export interface InterestCategory {
  title: string;
  groups: string[];
}

/**
 * `:` separates the category from the group and `,` separates groups, so a
 * name carrying either cannot be addressed; `*` and `|` are the delimiters.
 */
export const INTEREST_NAME = /^[^:,*|]+$/;

const COMPARISON: Record<MergeComparison, string> = { is: '=', not: '!=' };

/**
 * The tag pair that wraps a conditional block. An incomplete condition yields
 * nothing: emitting `*|IF:FNAME=|*` would hide the block from everyone.
 */
export function conditionTags(
  condition: MergeCondition | undefined
): { open: string; close: string } | undefined {
  if (!condition || !condition.field || !condition.value) {
    return undefined;
  }

  if (condition.kind === 'interest') {
    const open = `*|INTERESTED:${condition.field}:${condition.value}|*`;

    if (condition.operator === 'is') {
      return { open, close: '*|END:INTERESTED|*' };
    }

    // Mailchimp has no negative INTERESTED form, so "is not" is an empty true
    // branch with the content in ELSE. The tags sit against each other on
    // purpose: a space between them would land inside the empty branch.
    return { open: `${open}*|ELSE:|*`, close: '*|END:INTERESTED|*' };
  }

  return {
    open: `*|IF:${condition.field}${COMPARISON[condition.operator]}${condition.value}|*`,
    close: '*|END:IF|*',
  };
}

export type RequiredFooterTagKey = 'unsubscribe' | 'address';

export interface RequiredFooterTag {
  key: RequiredFooterTagKey;
  tags: string[];
}

/**
 * Mailchimp refuses to send a campaign without an unsubscribe link and a
 * postal address, but accepts the draft. `*|REWARDS|*` is only required on
 * the free plan and is left unchecked.
 */
export const REQUIRED_FOOTER_TAGS: RequiredFooterTag[] = [
  { key: 'unsubscribe', tags: ['*|UNSUB|*'] },
  {
    key: 'address',
    tags: [
      '*|HTML:LIST_ADDRESS_HTML|*',
      '*|LIST:ADDRESS|*',
      '*|LIST:ADDRESSLINE|*',
    ],
  },
];

/** Checked against the rendered HTML, which is what Mailchimp receives. */
export function missingRequiredFooterTags(html: string): RequiredFooterTag[] {
  return REQUIRED_FOOTER_TAGS.filter(
    required => !required.tags.some(tag => html.includes(tag))
  );
}

export const describeRequiredTag = (required: RequiredFooterTag): string =>
  `${required.key === 'unsubscribe' ? 'an unsubscribe link' : 'the postal address'} (${required.tags.join(' or ')})`;
