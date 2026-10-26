import { Box, Chip, TextField, Tooltip, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { TFunction } from 'i18next';
import { MailTemplateContext } from '@wepublish/editor/api';
import { InfoTooltip } from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ALWAYS_PLACEHOLDERS,
  MAIL_PLACEHOLDER_CONTEXTS,
  MailPlaceholder,
} from './mail-placeholders';

const PlaceholderGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const PlaceholderFormats = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex-basis: 100%;
  gap: ${({ theme }) => theme.spacing(0.75)};
`;

interface PlaceholderPickerProps {
  /** Inserts the given `{{token}}` into the active editor/field. */
  onInsert: (token: string) => void;
  /** The selected purpose; scopes which placeholders are shown/searched. */
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
  {
    suffix: '_year',
    labelKey: 'mailTemplates.dateFormat.year',
    label: 'Year',
    example: '2024',
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

/**
 * The description is shown in the tooltip and searched, so both use the
 * translated text. The code default stays as the fallback.
 */
const describePlaceholder = (t: TFunction, placeholder: MailPlaceholder) =>
  t(`mailTemplates.placeholderDescriptions.${placeholder.key}`, {
    defaultValue: placeholder.description,
    // The description of the login token contains a literal `{{jwt}}`; passing
    // it as a value keeps i18next from treating it as an interpolation.
    jwt: '{{jwt}}',
  });

export function PlaceholderPicker({
  onInsert,
  context,
}: PlaceholderPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const selectedContext =
    context ? MAIL_PLACEHOLDER_CONTEXTS.find(c => c.id === context) : undefined;

  // Search is scoped to the placeholders that actually resolve for the chosen
  // purpose (the always-available recipient fields + that purpose's fields).
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
        describePlaceholder(t, p).toLowerCase().includes(term)
      );
    });
  }, [search, scopedPlaceholders, t]);

  const tooltipText = (description: string, token: string, example: string) => (
    <>
      {description}
      <br />
      <code>{token}</code>
      <br />
      {t('mailTemplates.placeholderExample', 'Example')}: {example}
    </>
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
        <PlaceholderFormats
          key={placeholder.key}
          role="group"
          aria-label={name}
        >
          <Typography
            variant="caption"
            aria-hidden
          >
            {name}
          </Typography>
          <PlaceholderGroup>
            {formats.map(format => (
              <Tooltip
                key={format.suffix}
                placement="left"
                title={tooltipText(
                  describePlaceholder(t, placeholder),
                  `{{${placeholder.key}${format.suffix}}}`,
                  format.example
                )}
              >
                <Chip
                  label={t(format.labelKey, format.label)}
                  variant="outlined"
                  size="small"
                  clickable
                  onMouseDown={event => event.preventDefault()}
                  onClick={() =>
                    onInsert(`{{${placeholder.key}${format.suffix}}}`)
                  }
                />
              </Tooltip>
            ))}
          </PlaceholderGroup>
        </PlaceholderFormats>
      );
    }

    return (
      <Tooltip
        key={placeholder.key}
        placement="left"
        title={tooltipText(
          describePlaceholder(t, placeholder),
          `{{${placeholder.key}}}`,
          placeholder.example
        )}
      >
        <Chip
          label={name}
          variant="outlined"
          size="small"
          clickable
          onMouseDown={event => event.preventDefault()}
          onClick={() => onInsert(`{{${placeholder.key}}}`)}
        />
      </Tooltip>
    );
  };

  return (
    <div style={{ paddingRight: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          component="h2"
          variant="body1"
          sx={{ fontWeight: 700, margin: 0 }}
        >
          {t('mailTemplates.placeholders')}
        </Typography>
        <InfoTooltip text={t('mailTemplates.placeholdersInfo')} />
      </Box>
      <Typography
        variant="caption"
        style={{ marginBottom: 8 }}
        sx={{
          display: 'block',
        }}
      >
        {t('mailTemplates.placeholdersHint')}
      </Typography>
      <TextField
        fullWidth
        placeholder={t('mailTemplates.searchPlaceholders', 'Search…')}
        slotProps={{
          htmlInput: {
            'aria-label': t('mailTemplates.searchPlaceholdersLabel'),
          },
        }}
        value={search}
        onChange={event => setSearch(event.target.value)}
        sx={{ marginBottom: 1.5 }}
      />
      {searchResults ?
        searchResults.length ?
          <PlaceholderGroup>
            {searchResults.map(renderPlaceholder)}
          </PlaceholderGroup>
        : <Typography
            variant="caption"
            color="text.secondary"
          >
            {t('mailTemplates.noPlaceholders', 'No matching placeholders.')}
          </Typography>

      : <>
          <Typography
            variant="subtitle2"
            component="h3"
            style={{ marginBottom: 2 }}
          >
            {t(
              'mailTemplates.placeholderAlways',
              'Always available — every mail'
            )}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            style={{ marginBottom: 8 }}
            sx={{
              display: 'block',
            }}
          >
            {t(
              'mailTemplates.placeholderAlwaysHint',
              'These recipient fields work in every template, no matter which purpose is selected.'
            )}
          </Typography>
          <PlaceholderGroup>
            {ALWAYS_PLACEHOLDERS.map(renderPlaceholder)}
          </PlaceholderGroup>

          <Box
            sx={{
              marginTop: 2.5,
              paddingTop: 1.5,
              borderTop: '1px solid',
              borderTopColor: 'divider',
            }}
          >
            {!selectedContext ?
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                }}
              >
                {t(
                  'mailTemplates.placeholderSelectType',
                  'Choose a purpose above to see its placeholders.'
                )}
              </Typography>
            : <>
                <Typography
                  variant="subtitle2"
                  component="h3"
                  style={{ marginBottom: 2 }}
                >
                  {t(selectedContext.titleKey, selectedContext.title)}
                </Typography>
                {selectedContext.note && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    style={{ marginBottom: 8 }}
                    sx={{
                      display: 'block',
                    }}
                  >
                    {t(
                      `mailTemplates.placeholderContextNotes.${selectedContext.id}`,
                      selectedContext.note
                    )}
                  </Typography>
                )}
                {selectedContext.placeholders.length > 0 ?
                  <PlaceholderGroup>
                    {selectedContext.placeholders.map(renderPlaceholder)}
                  </PlaceholderGroup>
                : <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                    }}
                  >
                    {t(
                      'mailTemplates.placeholderContextNone',
                      'This purpose only uses the recipient fields above.'
                    )}
                  </Typography>
                }
              </>
            }
          </Box>
        </>
      }
    </div>
  );
}
