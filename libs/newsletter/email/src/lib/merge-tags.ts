/**
 * Mailchimp's merge tags: the vocabulary a prose block may carry, the tags that
 * make a block conditional, and the two the footer of a sent campaign has to
 * contain.
 *
 * A merge tag is *plain text* to everything in this repo. `inline.tsx` renders
 * `*|FNAME|*` as those literal characters and Mailchimp substitutes them in the
 * uploaded HTML after we are done with it, so the editor and the preview show the
 * tag and only the inbox shows the value. Nothing here resolves or previews one.
 *
 * The system list belongs to Mailchimp rather than to an account, so it is a
 * constant the editor bundles instead of an API call — every other part of the
 * editor works without a Mailchimp key. The *audience's* merge fields do need
 * one: see `fetchMergeFields` and the `newsletterMergeFields` query.
 *
 * Source: https://mailchimp.com/help/customize-your-footer-content/
 */

export interface MergeTag {
  /** The literal tag, e.g. `*|UNSUB|*`. */
  tag: string;
  /** German name in the picker — and the link text when `kind` is `url`. */
  label: string;
  /** What Mailchimp puts in its place. Shown as the row's title. */
  description: string;
  /**
   * A tag that expands to an address and nothing else.
   *
   * The picker inserts these as the *target* of a link rather than as text: a
   * bare `*|UNSUB|*` in a paragraph reaches the reader as a naked URL.
   */
  kind?: 'url';
}

/**
 * The tags the footer help page documents, required ones first.
 *
 * `*|ARCHIVE|*` is the one addition: it is not on that page — it belongs to the
 * campaign tags — but `NewsletterFooter` already uses it for "Im Browser
 * ansehen", so an editor writing that line into a text block would otherwise
 * have to type it from memory.
 */
export const SYSTEM_MERGE_TAGS: MergeTag[] = [
  {
    tag: '*|UNSUB|*',
    label: 'Vom Newsletter abmelden',
    description:
      'Link auf das Abmeldeformular. Von Mailchimp in jeder Kampagne verlangt.',
    kind: 'url',
  },
  {
    tag: '*|HTML:LIST_ADDRESS_HTML|*',
    label: 'Postadresse (formatiert)',
    description:
      'Postadresse des Publikums mit «Add us to your address book»-Link. Erfüllt die verlangte Adressangabe.',
  },
  {
    tag: '*|LIST:ADDRESS|*',
    label: 'Postadresse',
    description:
      'Postadresse des Publikums als reiner Text. Erfüllt die verlangte Adressangabe.',
  },
  {
    tag: '*|LIST:ADDRESSLINE|*',
    label: 'Postadresse (einzeilig)',
    description:
      'Postadresse des Publikums als reiner Text auf einer Zeile. Erfüllt die verlangte Adressangabe.',
  },
  {
    tag: '*|REWARDS|*',
    label: 'Referral-Badge',
    description:
      'Fügt das Referral-Badge ein. Im Gratis-Tarif von Mailchimp verlangt.',
  },
  {
    tag: '*|UPDATE_PROFILE|*',
    label: 'Einstellungen ändern',
    description: 'Link, über den ein Kontakt seine Einstellungen anpasst.',
    kind: 'url',
  },
  {
    tag: '*|ARCHIVE|*',
    label: 'Im Browser ansehen',
    description: 'Link auf die Browser-Version dieser Ausgabe.',
    kind: 'url',
  },
  {
    tag: '*|FORWARD|*',
    label: 'An Bekannte weiterleiten',
    description: 'Link auf das Weiterleitungsformular des Publikums.',
    kind: 'url',
  },
  {
    tag: '*|LIST:SUBSCRIBE|*',
    label: 'Newsletter abonnieren',
    description: 'Adresse des gehosteten Anmeldeformulars.',
    kind: 'url',
  },
  {
    tag: '*|ABOUT_LIST|*',
    label: 'Über diese Liste',
    description: 'Link auf die «About your list»-Seite.',
    kind: 'url',
  },
  {
    tag: '*|LIST:URL|*',
    label: 'Website',
    description: 'Die im Publikum hinterlegte Website-Adresse.',
    kind: 'url',
  },
  {
    tag: '*|LIST:ADDRESS_VCARD_HREF|*',
    label: 'Adressbuch-Eintrag',
    description: 'Adresse der vCard-Datei des Publikums.',
    kind: 'url',
  },
  {
    tag: '*|LIST:ADDRESS_VCARD|*',
    label: 'vCard-Link (fertig)',
    description: '«Add us to your address book»-Link auf die vCard.',
  },
  {
    tag: '*|LIST:DESCRIPTION|*',
    label: 'Permission Reminder',
    description:
      'Die Erinnerung des Publikums, warum ein Kontakt diese Mail erhält.',
  },
  {
    tag: '*|LIST:COMPANY|*',
    label: 'Firmenname',
    description: 'Name der Firma oder Organisation des Publikums.',
  },
  {
    tag: '*|LIST:NAME|*',
    label: 'Name des Publikums',
    description: 'Name des Mailchimp-Publikums.',
  },
  {
    tag: '*|LIST:PHONE|*',
    label: 'Telefonnummer',
    description: 'Die im Publikum hinterlegte Telefonnummer.',
  },
  {
    tag: '*|LIST:UID|*',
    label: 'Publikums-ID',
    description: 'Die eindeutige ID des Publikums.',
  },
  {
    tag: '*|ABUSE_EMAIL|*',
    label: 'Kontakt-E-Mail',
    description: 'Die in den Fusszeilen-Angaben hinterlegte E-Mail-Adresse.',
  },
  {
    tag: '*|EMAIL|*',
    label: 'E-Mail des Kontakts',
    description: 'Die E-Mail-Adresse der Empfängerin.',
  },
  {
    tag: '*|CURRENT_YEAR|*',
    label: 'Aktuelles Jahr',
    description: 'Das laufende Jahr, vierstellig.',
  },
];

/** Whether the audience already gets this tag from the list above. */
export const isSystemMergeTag = (tag: string): boolean =>
  SYSTEM_MERGE_TAGS.some(known => known.tag === tag);

/**
 * The part of a tag between the delimiters — `UNSUB`, `LIST:URL`.
 *
 * Its own constant because a block's condition names a field *without* them
 * (`*|IF:GROUPING=Cacti|*`, not `*|IF:*|GROUPING|*=Cacti|*`), so two callers
 * need the character class and only one of them wants the `*|…|*` around it.
 *
 * Digits and the colon are in it because `*|LIST:SUBSCRIBE|*` and `*|LIST:URL|*`
 * are link targets and would otherwise be rejected as malformed URLs.
 */
export const MERGE_TAG_NAME_SOURCE = '[A-Z0-9_:]+';

/**
 * What a merge tag looks like, as pattern source rather than a regex.
 *
 * Two callers need it in different shapes — `MERGE_TAG_HREF` anchors it to
 * validate a whole `href`, `inlineMarkup` embeds it in an alternation to *skip*
 * one — and a second copy would eventually recognise a tag the other rejects.
 */
export const MERGE_TAG_SOURCE = `\\*\\|${MERGE_TAG_NAME_SOURCE}\\|\\*`;

/**
 * A merge tag as an `href`.
 *
 * Safe to wave past `asUrl` because it is anchored at both ends: the value must
 * begin `*|` and end `|*`, and no URL scheme may contain either character — so
 * nothing matching this can be a `javascript:` href, only a relative path a mail
 * client will hand back to Mailchimp intact.
 */
export const MERGE_TAG_HREF = new RegExp(`^${MERGE_TAG_SOURCE}$`);

/** A merge field's bare name, which is what a condition compares. */
export const MERGE_TAG_NAME = new RegExp(`^${MERGE_TAG_NAME_SOURCE}$`);

/** `*|FNAME|*` → `FNAME`, for the picker that hands over a whole tag. */
export const mergeTagName = (tag: string): string =>
  tag.trim().replace(/^\*\|/, '').replace(/\|\*$/, '');

/**
 * What Mailchimp's dashboard calls **dynamic content**: a block that only some
 * of the audience is shown.
 *
 * The feature is nothing but a pair of conditional merge tags around the block's
 * markup, literal text here like every other merge tag: Mailchimp evaluates them
 * in the uploaded HTML, removing either the tags or the block between them.
 * Nothing here can evaluate a condition — what is compared belongs to the
 * subscriber, and there is no subscriber until the send.
 *
 * Two comparisons, spelled as Mailchimp's own UI spells them, because a free-text
 * operator field would let an editor write one Mailchimp answers by showing the
 * block to nobody. `IF` also takes `>`, `<`, `>=` and `<=`; they are left out
 * because every field an editor can pick here holds text.
 *
 * Source: https://mailchimp.com/help/use-conditional-merge-tag-blocks/
 */
export type MergeComparison = 'is' | 'not';

/**
 * Which vocabulary the left-hand side of a condition belongs to.
 *
 * Mailchimp writes the two conditions differently and they are *not*
 * interchangeable. A merge field is compared inside an `IF`:
 *
 *     *|IF:FNAME=Bob|* … *|END:IF|*
 *
 * A group — an interest category and one of its group names — has a conditional
 * tag of its own, which takes both halves and no operator at all:
 *
 *     *|INTERESTED:Kundschaft:Stammkundschaft|* … *|END:INTERESTED|*
 *
 * Which is why a group cannot be squeezed into the `IF` form. There is no
 * `GROUPING` merge field in Mailchimp, so `*|IF:GROUPING=Cacti|*` evaluates
 * against nothing; and a real category title carries spaces, which would end the
 * tag's field name besides.
 *
 * Absent means `field`.
 */
export type MergeConditionKind = 'field' | 'interest';

export interface MergeCondition {
  kind?: MergeConditionKind;
  /**
   * The merge field without its delimiters — `FNAME`, not `*|FNAME|*` — or, when
   * `kind` is `interest`, the interest category's title.
   */
  field: string;
  operator: MergeComparison;
  /**
   * The compared value, verbatim: Mailchimp's own conditions are unquoted.
   *
   * For a group this is the group's name, which Mailchimp matches *exactly* —
   * capitalisation and spacing included. That is why the editor offers the names
   * the API reports rather than a text box: a name typed from memory produces a
   * condition that looks right in the draft and reaches nobody.
   */
  value: string;
}

/**
 * An interest category and the group names inside it, as Mailchimp spells them.
 *
 * Here rather than in `mailchimp.ts` because it is part of the condition
 * vocabulary, not of the API client: `conditionTags` is what consumes the two
 * halves, and the editor needs the type without reaching into a module that
 * talks to Mailchimp.
 */
export interface InterestCategory {
  title: string;
  groups: string[];
}

/**
 * A category title or group name that can be named in a tag at all.
 *
 * `:` separates the category from the group and `,` separates several groups, so
 * a name carrying either cannot be addressed — and `*` and `|` are the tag's own
 * delimiters. Mailchimp's documentation says only that the category may not
 * contain a colon; the rest follows from the same parse. `fetchInterestCategories`
 * drops such a name rather than offering it, and `parseDocument` refuses one that
 * arrives from anywhere else — the alternative is a condition that reads as
 * complete in the editor and matches nobody in the send.
 */
export const INTEREST_NAME = /^[^:,*|]+$/;

/** How Mailchimp writes each comparison inside an `IF`. */
const COMPARISON: Record<MergeComparison, string> = { is: '=', not: '!=' };

/**
 * The tag pair that wraps a conditional block, or nothing at all.
 *
 * "Nothing" covers a condition that names no field and one whose comparison
 * value is still empty. Both mean the editor is halfway through choosing one,
 * and the block is then shown to everyone — the same thing it did before the
 * setting existed, and visible in the preview as the absence of the tags.
 * Emitting `*|IF:FNAME=|*` instead would hide the block from the whole audience,
 * which is the failure nobody notices until after the send.
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

    // Mailchimp documents no negative form of `INTERESTED` — there is no
    // `*|IFNOT:INTERESTED:…|*` — so «ist nicht» is the same block with its true
    // branch left empty and the content in the documented `*|ELSE:|*` branch.
    //
    // The two tags sit against each other on purpose: `|*` closes the first and
    // `*|` opens the second, which is unambiguous left to right, while a space
    // put between them would land *inside* the empty branch and so reach exactly
    // the subscribers the block is meant to skip. The `|**|` that the seam spells
    // is never read as bold — these tags are text nodes emitted by `renderBlock`
    // and never pass through `inline.tsx`.
    return { open: `${open}*|ELSE:|*`, close: '*|END:INTERESTED|*' };
  }

  return {
    open: `*|IF:${condition.field}${COMPARISON[condition.operator]}${condition.value}|*`,
    close: '*|END:IF|*',
  };
}

/**
 * One thing Mailchimp insists the footer carries, and the tags that supply it.
 *
 * Any one tag of a group satisfies it — the address has three spellings, and an
 * issue that uses the single-line one is as compliant as one using the block.
 */
export interface RequiredFooterTag {
  /** German name of what is missing, for the message that names it. */
  what: string;
  tags: string[];
}

/**
 * "You must include an unsubscribe link and physical address with every
 * marketing email you send."
 *
 * `*|REWARDS|*` is the third tag the help page calls required, but only on the
 * free plan — the API does not tell us the plan on any call this app already
 * makes, and demanding the badge from a paying account would refuse every
 * publish. It is offered in the picker above and left unchecked here.
 */
export const REQUIRED_FOOTER_TAGS: RequiredFooterTag[] = [
  { what: 'ein Abmeldelink', tags: ['*|UNSUB|*'] },
  {
    what: 'die Postadresse',
    tags: [
      '*|HTML:LIST_ADDRESS_HTML|*',
      '*|LIST:ADDRESS|*',
      '*|LIST:ADDRESSLINE|*',
    ],
  },
];

/**
 * Which of the required tags the rendered issue does not contain.
 *
 * Deliberately checked against the *rendered HTML* rather than the document:
 * the tags an issue actually ships come from `NewsletterFooter`, which is part
 * of the shell and not a block, so a document-level check would report every
 * issue as missing all of them. Searching the finished string is also the only
 * form of the check that keeps working if an editor writes the footer by hand
 * into a text block instead.
 */
export function missingRequiredFooterTags(html: string): RequiredFooterTag[] {
  return REQUIRED_FOOTER_TAGS.filter(
    required => !required.tags.some(tag => html.includes(tag))
  );
}

/** `ein Abmeldelink (*|UNSUB|*)` — how the publish error names what is absent. */
export const describeRequiredTag = (required: RequiredFooterTag): string =>
  `${required.what} (${required.tags.join(' oder ')})`;
