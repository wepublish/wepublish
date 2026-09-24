import { useApolloClient } from '@apollo/client';
import type { CustomField } from '@measured/puck';
import type {
  MergeComparison,
  MergeCondition,
  MergeConditionKind,
} from '@wepublish/newsletter';
import { conditionTags, mergeTagName } from '@wepublish/newsletter';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MergeTagCatalogue } from './merge-tags';
import { loadMergeTags } from './merge-tags';
import {
  ConditionPreview,
  ConditionRow,
  Note,
  SmallInput,
  SmallSelect,
} from './styles';

/**
 * Mailchimp's dynamic content as one row of three controls: merge field,
 * comparison, value. Only the audience's own fields and interest categories
 * are offered; a system tag holds the same value for everyone and so never
 * makes a condition.
 */

export const NO_CONDITION: MergeCondition = {
  kind: 'field',
  field: '',
  operator: 'is',
  value: '',
};

interface FieldChoice {
  kind: MergeConditionKind;
  name: string;
  label: string;
  hint?: string;
  group: string;
  values: string[];
}

const matches = (choice: FieldChoice, condition: MergeCondition): boolean =>
  choice.kind === (condition.kind ?? 'field') &&
  choice.name === condition.field;

const optionValue = (choice: FieldChoice): string =>
  `${choice.kind}:${choice.name}`;

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

function choices(
  catalogue: MergeTagCatalogue | null,
  condition: MergeCondition,
  groups: { fields: string; interests: string; stored: string }
): FieldChoice[] {
  const fields: FieldChoice[] = (catalogue?.fields ?? []).map(tag => ({
    kind: 'field' as const,
    name: mergeTagName(tag.tag),
    label: tag.label,
    hint: mergeTagName(tag.tag),
    group: groups.fields,
    values: [],
  }));

  const interests: FieldChoice[] = (catalogue?.interests ?? []).map(
    category => ({
      kind: 'interest' as const,
      name: category.title,
      label: category.title,
      group: groups.interests,
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

  // A stored field the catalogue no longer offers stays selectable: a select
  // whose value is missing would show the first option and silently change
  // the condition the block carries.
  return [
    ...known,
    {
      kind: condition.kind ?? 'field',
      name: condition.field,
      label: condition.field,
      group: groups.stored,
      values: [],
    },
  ];
}

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
  const client = useApolloClient();
  const [catalogue, setCatalogue] = useState<MergeTagCatalogue | null>(null);

  useEffect(() => {
    let live = true;

    void loadMergeTags(client, t).then(loaded => {
      if (live) {
        setCatalogue(loaded);
      }
    });

    return () => {
      live = false;
    };
  }, [client, t]);

  const options = choices(catalogue, value, {
    fields: t('newsletter.condition.groupFields'),
    interests: t('newsletter.condition.groupInterests'),
    stored: t('newsletter.condition.groupStored'),
  });
  const selected = options.find(choice => matches(choice, value));
  const tags = conditionTags(value);

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

  const groupNames =
    (
      selected?.values.length &&
      !selected.values.includes(value.value) &&
      value.value !== ''
    ) ?
      [...selected.values, value.value]
    : (selected?.values ?? []);

  return (
    <div>
      <ConditionRow>
        <SmallSelect
          id={id}
          value={
            value.field === '' ? ''
            : selected ?
              optionValue(selected)
            : ''
          }
          onChange={event => pickField(event.currentTarget.value)}
        >
          <option value="">{t('newsletter.condition.always')}</option>
          {groupsOf(options).map(group => (
            <optgroup
              key={group}
              label={group}
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
        </SmallSelect>

        <SmallSelect
          value={value.operator}
          disabled={value.field === ''}
          onChange={event =>
            onChange({
              ...value,
              operator: event.currentTarget.value as MergeComparison,
            })
          }
        >
          <option value="is">{t('newsletter.condition.is')}</option>
          <option value="not">{t('newsletter.condition.isNot')}</option>
        </SmallSelect>

        {groupNames.length > 0 ?
          <SmallSelect
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
          </SmallSelect>
        : <SmallInput
            type="text"
            value={value.value}
            disabled={value.field === ''}
            placeholder={t('newsletter.condition.value')}
            onChange={event =>
              onChange({ ...value, value: event.currentTarget.value })
            }
          />
        }
      </ConditionRow>

      {tags ?
        <ConditionPreview>
          <code>{tags.open}</code> … <code>{tags.close}</code>
        </ConditionPreview>
      : null}

      {value.field !== '' && value.value.trim() === '' ?
        <Note kind="error">{t('newsletter.condition.emptyValue')}</Note>
      : null}

      {catalogue?.error ?
        <Note>{catalogue.error}</Note>
      : null}

      {catalogue !== null && !catalogue.error && options.length === 0 ?
        <Note>{t('newsletter.condition.nothingToCompare')}</Note>
      : null}

      <Note>{t('newsletter.condition.hint')}</Note>
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
