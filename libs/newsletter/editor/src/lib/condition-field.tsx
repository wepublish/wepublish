/**
 * The per-block "dynamischer Inhalt" setting: Mailchimp's dynamic content, as
 * one row of three controls — merge field, comparison, value.
 *
 * The row is deliberately the one Mailchimp's own dashboard shows, because an
 * editor who has set dynamic content there is looking for the same three boxes:
 *
 *   [ Merge-Tag ▾ ]  [ ist / ist nicht ▾ ]  [ Wert ]
 *
 * What it stores is a `MergeCondition`, and `renderBlock` turns that into the
 * tag pair around the block — `*|IF:FNAME=Bob|*` … `*|END:IF|*` for a merge
 * field, `*|INTERESTED:Kategorie:Gruppe|*` … `*|END:INTERESTED|*` for a group.
 * Nothing here evaluates anything: what is compared belongs to the subscriber,
 * so the canvas and the preview show every conditional block, with its tags
 * visible as the literal characters — the same deal every other merge tag gets.
 *
 * The dropdown is fed by `loadMergeTags`, but from two of its three lists only:
 * the audience's own contact fields and its interest categories. Mailchimp's
 * *system* tags are deliberately absent, and that is not tidying. A system tag
 * describes the campaign or the audience rather than the subscriber —
 * `*|LIST:NAME|*`, `*|CURRENT_YEAR|*`, `*|ARCHIVE|*` hold the same value for
 * everyone on the list — so a condition on one is never a condition at all: it
 * shows the block to the whole audience or to none of it, with nothing in the
 * draft to say which.
 *
 * The *value* control differs by what the dropdown selected, and that is the
 * point of fetching the categories at all. A merge field is compared against
 * free text. A group is not: Mailchimp matches a group name exactly, spacing and
 * capitalisation included, and a name typed from memory gives a condition that
 * looks complete in the draft and reaches nobody. So a category offers its own
 * group names as a second dropdown.
 */
import type { CustomField } from '@puckeditor/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  MergeComparison,
  MergeCondition,
  MergeConditionKind,
} from '@wepublish/newsletter/email';
import { conditionTags, mergeTagName } from '@wepublish/newsletter/email';
import type { MergeTagCatalogue } from './merge-tags';
import { loadMergeTags } from './merge-tags';

/**
 * The shape Puck holds, which is always an object.
 *
 * `undefined` would be the honest way to say "no condition", but Puck renders a
 * field from `defaultProps` and every read here would then need a fallback of
 * its own. `toBlock` drops an empty one on the way into the document instead —
 * see `toCondition` in `convert.ts`.
 */
export const NO_CONDITION: MergeCondition = {
  kind: 'field',
  field: '',
  operator: 'is',
  value: '',
};

const COMPARISONS: { value: MergeComparison; label: string }[] = [
  { value: 'is', label: 'newsletter.condition.is' },
  { value: 'not', label: 'newsletter.condition.not' },
];

// Translation keys, shown as the dropdown's `<optgroup>` labels.
const FIELD_GROUP = 'newsletter.mergeTags.fields';
const INTEREST_GROUP = 'newsletter.condition.interests';
const STORED_GROUP = 'newsletter.condition.stored';

interface FieldChoice {
  kind: MergeConditionKind;
  /** The merge field name (`FNAME`), or the interest category's title. */
  name: string;
  label: string;
  /** The bare tag shown after the label, where the label is not already it. */
  hint?: string;
  group: string;
  /** A category's group names; empty for a merge field, whose value is typed. */
  values: string[];
}

/** Whether a choice is the one a stored condition names. */
const matches = (choice: FieldChoice, condition: MergeCondition): boolean =>
  choice.kind === (condition.kind ?? 'field') &&
  choice.name === condition.field;

/**
 * One `<option>`'s value, which has to carry the kind as well as the name.
 *
 * A category could in principle be titled the same as a merge field, and the
 * two would then be one option that stores whichever kind happened to be listed
 * last — a condition written into the wrong tag entirely.
 */
const optionValue = (choice: FieldChoice): string =>
  `${choice.kind}:${choice.name}`;

/**
 * `field:HTML:LIST_ADDRESS_HTML` → `{ kind: 'field', name: 'HTML:LIST_ADDRESS_HTML' }`.
 *
 * Split at the *first* colon only: a merge field's own name may contain one, and
 * a category title may not — `INTEREST_NAME` refuses it and
 * `fetchInterestCategories` never offers one — so the first colon is always the
 * separator `optionValue` added and never part of the name.
 */
function parseOptionValue(value: string): {
  kind: MergeConditionKind;
  name: string;
} {
  const separator = value.indexOf(':');

  return {
    kind: value.slice(0, separator) === 'interest' ? 'interest' : 'field',
    name: value.slice(separator + 1),
  };
}

/**
 * The catalogue as the dropdown's options: the contact fields, then the interest
 * categories.
 *
 * A field the catalogue does not offer is added as its own option rather than
 * dropped — the audience's fields could not be fetched, the field was renamed in
 * Mailchimp since, or it is a system tag chosen back when the dropdown still
 * listed them. A `<select>` whose value is missing shows the first option
 * instead, so the block would silently change the condition it carries the
 * moment an editor selected it.
 */
function choices(
  catalogue: MergeTagCatalogue | null,
  condition: MergeCondition
): FieldChoice[] {
  const fields: FieldChoice[] = (catalogue?.fields ?? []).map(tag => ({
    kind: 'field' as const,
    name: mergeTagName(tag.tag),
    label: tag.label,
    hint: mergeTagName(tag.tag),
    group: FIELD_GROUP,
    values: [],
  }));

  const interests: FieldChoice[] = (catalogue?.interests ?? []).map(
    category => ({
      kind: 'interest' as const,
      name: category.title,
      // No hint: the title *is* the name, and «Kundschaft (Kundschaft)» reads as a
      // bug rather than as help.
      label: category.title,
      group: INTEREST_GROUP,
      values: category.groups,
    })
  );

  const known = [...fields, ...interests];

  if (
    condition.field === '' ||
    known.some(choice => matches(choice, condition))
  ) {
    return known;
  }

  return [
    ...known,
    {
      kind: condition.kind ?? 'field',
      name: condition.field,
      label: condition.field,
      group: STORED_GROUP,
      values: [],
    },
  ];
}

/** The options of one `<optgroup>`, in the order the catalogue lists them. */
const groupsOf = (list: FieldChoice[]): string[] => [
  ...new Set(list.map(choice => choice.group)),
];

function ConditionEditor({
  value,
  onChange,
  id,
}: {
  value: MergeCondition;
  onChange: (next: MergeCondition) => void;
  id: string;
}) {
  const { t } = useTranslation();
  const [catalogue, setCatalogue] = useState<MergeTagCatalogue | null>(null);

  useEffect(() => {
    // On mount rather than on first use: a `<select>` needs its options before
    // it is opened, and there is no event that fires early enough. The request
    // is shared with every prose field's picker and made once per page.
    let live = true;

    void loadMergeTags().then(loaded => {
      if (live) {
        setCatalogue(loaded);
      }
    });

    return () => {
      live = false;
    };
  }, []);

  const options = choices(catalogue, value);
  const selected = options.find(choice => matches(choice, value));
  const tags = conditionTags(value);

  /**
   * Selecting a different left-hand side, carrying the typed value only where it
   * still means something.
   *
   * Between two merge fields it does — an editor retargeting `FNAME` at `LNAME`
   * has not changed their mind about "Bob". Everywhere else it does not: a group
   * name belongs to one category and names nothing in another, and free text
   * typed for a merge field is not a group name at all. Kept across those, it
   * would leave a condition that reads as finished and matches nobody.
   */
  const pickField = (raw: string) => {
    if (raw === '') {
      onChange(NO_CONDITION);

      return;
    }

    const picked = parseOptionValue(raw);
    const keep = picked.kind === 'field' && (value.kind ?? 'field') === 'field';

    onChange({
      kind: picked.kind,
      field: picked.name,
      operator: value.operator,
      value: keep ? value.value : '',
    });
  };

  /**
   * The group names to choose from, with a stored one that is no longer among
   * them kept — the same reason the field dropdown keeps an unknown field, and
   * the case is a group renamed in Mailchimp after the issue was drafted.
   */
  const groupNames =
    (
      selected?.values.length &&
      !selected.values.includes(value.value) &&
      value.value !== ''
    ) ?
      [...selected.values, value.value]
    : (selected?.values ?? []);

  return (
    <div className="condition-field">
      <div className="condition-row">
        <select
          id={id}
          className="condition-tag"
          value={
            value.field === '' ? ''
            : selected ?
              optionValue(selected)
            : ''
          }
          onChange={event => pickField(event.currentTarget.value)}
        >
          {/* First and always available: clearing the field is how a block goes
              back to being shown to everyone, and an editor should not have to
              guess that emptying the value box does the same thing. */}
          <option value="">{t('newsletter.condition.always')}</option>
          {groupsOf(options).map(group => (
            <optgroup
              key={group}
              label={t(group)}
            >
              {options
                .filter(choice => choice.group === group)
                .map(choice => (
                  <option
                    key={optionValue(choice)}
                    value={optionValue(choice)}
                  >
                    {choice.hint ?
                      `${choice.label} (${choice.hint})`
                    : choice.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>

        <select
          className="condition-operator"
          value={value.operator}
          disabled={value.field === ''}
          onChange={event =>
            onChange({
              ...value,
              operator: event.currentTarget.value as MergeComparison,
            })
          }
        >
          {COMPARISONS.map(comparison => (
            <option
              key={comparison.value}
              value={comparison.value}
            >
              {t(comparison.label)}
            </option>
          ))}
        </select>

        {/* A group's names come from the audience, so they are chosen rather than
            typed; a merge field's value is whatever the contact table holds and
            has to be free text. A category whose names are not loaded yet — or
            one the catalogue no longer offers — falls back to the text box, so a
            stored condition stays readable and editable either way. */}
        {groupNames.length > 0 ?
          <select
            className="condition-value"
            value={value.value}
            onChange={event =>
              onChange({ ...value, value: event.currentTarget.value })
            }
          >
            <option value="">{t('newsletter.condition.pickGroup')}</option>
            {groupNames.map(name => (
              <option
                key={name}
                value={name}
              >
                {name}
              </option>
            ))}
          </select>
        : <input
            type="text"
            className="condition-value"
            value={value.value}
            disabled={value.field === ''}
            placeholder={t('newsletter.condition.value')}
            onChange={event =>
              onChange({ ...value, value: event.currentTarget.value })
            }
          />
        }
      </div>

      {/* The tag pair itself, because it is what actually ships: an editor
          comparing a draft against a Mailchimp segment needs to read the
          condition, and a value with a stray `|` in it is refused on save with a
          message that only makes sense once you have seen the tag. */}
      {tags ?
        <p className="condition-preview">
          <code>{tags.open}</code> … <code>{tags.close}</code>
        </p>
      : null}

      {/* Chosen but empty is the one state worth warning about: it stores no
          condition at all, so the block goes to the whole audience — which is
          the opposite of what the editor was in the middle of setting up. */}
      {value.field !== '' && value.value.trim() === '' ?
        <p className="condition-note condition-warn">
          {t('newsletter.condition.noValue')}
        </p>
      : null}

      {catalogue?.error ?
        <p className="condition-note">{catalogue.error}</p>
      : null}

      {/* With the system tags gone the dropdown can genuinely be empty — an
          audience with no extra contact fields and no groups — and «Immer
          anzeigen» alone reads as a broken control rather than as an answer.
          Only when nothing failed: `catalogue.error` already says more. */}
      {catalogue !== null && !catalogue.error && options.length === 0 ?
        <p className="condition-note">
          {t('newsletter.condition.nothingToCompare')}
        </p>
      : null}

      <p className="condition-note">
        {t('newsletter.condition.evaluatedAtSend')}
      </p>
    </div>
  );
}

export function conditionField(label: string): CustomField<MergeCondition> {
  return {
    type: 'custom',
    label,
    render: ({ value, onChange, id }) => (
      <ConditionEditor
        value={value ?? NO_CONDITION}
        onChange={onChange}
        id={id}
      />
    ),
  };
}
