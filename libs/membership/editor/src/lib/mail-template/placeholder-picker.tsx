import { Typography } from '@mui/material';
import { MailTemplateContext } from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Tooltip, Whisper } from 'rsuite';
import {
  ALWAYS_PLACEHOLDERS,
  MAIL_PLACEHOLDER_CONTEXTS,
  MailPlaceholder,
} from './mail-placeholders';

interface PlaceholderPickerProps {
  /** Inserts the given `{{token}}` into the active editor/field. */
  onInsert: (token: string) => void;
  /** The selected mail type; scopes which placeholders are shown/searched. */
  context: MailTemplateContext | null;
}

const DATE_FORMATS = [
  {
    suffix: '_date',
    labelKey: 'mailTemplates.dateFormat.date',
    label: 'Date',
    example: '30.06.2026',
  },
  {
    suffix: '_dateLong',
    labelKey: 'mailTemplates.dateFormat.long',
    label: 'Long',
    example: '30. Juni 2026',
  },
  {
    suffix: '_weekday',
    labelKey: 'mailTemplates.dateFormat.weekday',
    label: 'Weekday',
    example: 'Dienstag',
  },
  {
    suffix: '_time',
    labelKey: 'mailTemplates.dateFormat.time',
    label: 'Time',
    example: '10:22',
  },
];

const AMOUNT_FORMATS = [
  {
    suffix: '_display',
    labelKey: 'mailTemplates.amountFormat.display',
    label: 'With currency',
    example: 'CHF 10.00',
  },
  {
    suffix: '_chf',
    labelKey: 'mailTemplates.amountFormat.chf',
    label: 'CHF',
    example: '10.00',
  },
  {
    suffix: '',
    labelKey: 'mailTemplates.amountFormat.rappen',
    label: 'Rappen',
    example: '1000',
  },
];

export function PlaceholderPicker({
  onInsert,
  context,
}: PlaceholderPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const selectedContext =
    context ? MAIL_PLACEHOLDER_CONTEXTS.find(c => c.id === context) : undefined;

  // Search is scoped to the placeholders that actually resolve for the chosen
  // mail type (the always-available recipient fields + that type's fields).
  const scopedPlaceholders = useMemo(
    () => [...ALWAYS_PLACEHOLDERS, ...(selectedContext?.placeholders ?? [])],
    [selectedContext]
  );

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return null;
    }
    const seen = new Set<string>();
    return scopedPlaceholders.filter(p => {
      if (seen.has(p.key)) {
        return false;
      }
      seen.add(p.key);
      const name = t(
        `mailTemplates.placeholderNames.${p.key}`,
        p.label
      ).toLowerCase();
      return (
        p.key.toLowerCase().includes(term) ||
        name.includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    });
  }, [search, scopedPlaceholders, t]);

  const tooltip = (description: string, token: string, example: string) => (
    <Tooltip>
      {description}
      <br />
      <code>{token}</code>
      <br />
      {t('mailTemplates.placeholderExample', 'Example')}: {example}
    </Tooltip>
  );

  const renderPlaceholder = (placeholder: MailPlaceholder) => {
    const name = t(
      `mailTemplates.placeholderNames.${placeholder.key}`,
      placeholder.label
    );
    const formats =
      placeholder.kind === 'date' ? DATE_FORMATS
      : placeholder.kind === 'money' ? AMOUNT_FORMATS
      : null;

    if (formats) {
      return (
        <div
          key={placeholder.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 2,
          }}
        >
          <Typography
            variant="caption"
            style={{
              flex: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {formats.map(format => (
              <Whisper
                key={format.suffix}
                trigger="hover"
                placement="left"
                speaker={tooltip(
                  placeholder.description,
                  `{{${placeholder.key}${format.suffix}}}`,
                  format.example
                )}
              >
                <Button
                  appearance="ghost"
                  size="xs"
                  style={{ padding: '1px 6px' }}
                  onClick={() =>
                    onInsert(`{{${placeholder.key}${format.suffix}}}`)
                  }
                >
                  {t(format.labelKey, format.label)}
                </Button>
              </Whisper>
            ))}
          </div>
        </div>
      );
    }

    return (
      <Whisper
        key={placeholder.key}
        trigger="hover"
        placement="left"
        speaker={tooltip(
          placeholder.description,
          `{{${placeholder.key}}}`,
          placeholder.example
        )}
      >
        <Button
          appearance="ghost"
          size="xs"
          block
          onClick={() => onInsert(`{{${placeholder.key}}}`)}
          style={{ textAlign: 'left', padding: '1px 8px', marginBottom: 2 }}
        >
          {name}
        </Button>
      </Whisper>
    );
  };

  return (
    <div style={{ paddingRight: 4 }}>
      <strong>{t('mailTemplates.placeholders')}</strong>
      <Typography
        variant="caption"
        display="block"
        style={{ marginBottom: 8 }}
      >
        {t('mailTemplates.placeholdersHint')}
      </Typography>

      <Input
        size="sm"
        placeholder={t('mailTemplates.searchPlaceholders', 'Search…')}
        value={search}
        onChange={setSearch}
        style={{ marginBottom: 12 }}
      />

      {searchResults ?
        searchResults.length ?
          searchResults.map(renderPlaceholder)
        : <Typography
            variant="caption"
            style={{ color: '#8e8e93' }}
          >
            {t('mailTemplates.noPlaceholders', 'No matching placeholders.')}
          </Typography>

      : <>
          <Typography
            variant="subtitle2"
            style={{ marginBottom: 2 }}
          >
            {t(
              'mailTemplates.placeholderAlways',
              'Always available — every mail'
            )}
          </Typography>
          <Typography
            variant="caption"
            display="block"
            style={{ marginBottom: 8, color: '#8e8e93' }}
          >
            {t(
              'mailTemplates.placeholderAlwaysHint',
              'These recipient fields work in every template, no matter which mail is selected below.'
            )}
          </Typography>
          {ALWAYS_PLACEHOLDERS.map(renderPlaceholder)}

          <div
            style={{
              marginTop: 20,
              paddingTop: 12,
              borderTop: '1px solid #e5e5ea',
            }}
          >
            {!selectedContext ?
              <Typography
                variant="caption"
                display="block"
                style={{ color: '#8e8e93' }}
              >
                {t(
                  'mailTemplates.placeholderSelectType',
                  'Select a mail type above to see its placeholders.'
                )}
              </Typography>
            : <>
                <Typography
                  variant="subtitle2"
                  style={{ marginBottom: 2 }}
                >
                  {t(selectedContext.titleKey, selectedContext.title)}
                </Typography>
                {selectedContext.note && (
                  <Typography
                    variant="caption"
                    display="block"
                    style={{ marginBottom: 8, color: '#8e8e93' }}
                  >
                    {selectedContext.note}
                  </Typography>
                )}
                {selectedContext.placeholders.length > 0 ?
                  selectedContext.placeholders.map(renderPlaceholder)
                : <Typography
                    variant="caption"
                    display="block"
                    style={{ color: '#8e8e93' }}
                  >
                    {t(
                      'mailTemplates.placeholderContextNone',
                      'This mail only uses the recipient fields above.'
                    )}
                  </Typography>
                }
              </>
            }
          </div>
        </>
      }
    </div>
  );
}
