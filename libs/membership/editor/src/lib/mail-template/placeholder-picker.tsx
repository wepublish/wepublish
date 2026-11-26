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
  /* The title sits close to its own chips: little space below it, the usual
     space beside it when a chip fits on the same line. */
  gap: ${({ theme }) => `${theme.spacing(0.25)} ${theme.spacing(0.75)}`};
  /* A little air above each titled set, so it reads as a block of its own. */
  margin-top: ${({ theme }) => theme.spacing(1)};

  &:first-child {
    margin-top: 0;
  }
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

/**
 * A group's title with what there is to know about it in a tooltip beside it,
 * not inside: the heading keeps its own name.
 */
function GroupHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        marginBottom: 1,
        // A tinted bar, so the eye finds where one group ends and the next
        // begins. A theme colour: it follows light and dark mode.
        paddingBlock: 0.5,
        paddingInline: 1,
        borderRadius: 1,
        bgcolor: 'action.hover',
      }}
    >
      <Typography
        variant="subtitle2"
        component="h3"
        sx={{ margin: 0 }}
      >
        {title}
      </Typography>
      {hint && <InfoTooltip text={hint} />}
    </Box>
  );
}

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
            // Level with the text inside the chips below, not with their
            // outline, and on a line of its own even when a chip would fit
            // beside it.
            sx={{ paddingLeft: '8px', flexBasis: '100%' }}
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

  /**
   * The chips of a list, neighbours of the same set under a title of their
   * own. Not for search results: there every hit stands for itself.
   */
  const renderPlaceholders = (
    placeholders: MailPlaceholder[],
    /** The set the untitled chips at the start of the list are shown as. */
    leadingSet: string
  ) => {
    const runs: { set?: string; items: MailPlaceholder[] }[] = [];
    let leading = true;

    for (const placeholder of placeholders) {
      // A placeholder with formats brings a title of its own.
      leading &&= !placeholder.set && !placeholder.kind;

      const set = leading ? leadingSet : placeholder.set;
      const last = runs.at(-1);

      if (last && set && last.set === set) {
        last.items.push(placeholder);
      } else {
        runs.push({ set, items: [placeholder] });
      }
    }

    return runs.flatMap(({ set, items }) => {
      if (!set) {
        return items.map(renderPlaceholder);
      }

      const title = t(`mailTemplates.placeholderGroups.${set}`, set);

      return (
        <PlaceholderFormats
          key={`set-${set}-${items[0].key}`}
          role="group"
          aria-label={title}
        >
          <Typography
            variant="caption"
            aria-hidden
            sx={{ paddingLeft: '8px', flexBasis: '100%' }}
          >
            {title}
          </Typography>
          <PlaceholderGroup>{items.map(renderPlaceholder)}</PlaceholderGroup>
        </PlaceholderFormats>
      );
    });
  };

  return (
    <div style={{ paddingRight: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          marginBottom: 1.5,
        }}
      >
        <Typography
          component="h2"
          variant="body1"
          sx={{ fontWeight: 700, margin: 0 }}
        >
          {t('mailTemplates.placeholders')}
        </Typography>
        {/* How to use them first, what they are below, as two bullets: the
            tooltip keeps line breaks. */}
        <InfoTooltip
          text={`• ${t('mailTemplates.placeholdersHint')}\n• ${t('mailTemplates.placeholdersInfo')}`}
        />
      </Box>
      <TextField
        fullWidth
        placeholder={t(
          'mailTemplates.searchPlaceholders',
          'Filter placeholders…'
        )}
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
          <GroupHeading
            title={t('mailTemplates.placeholderAlways', 'Always available')}
            hint={t(
              'mailTemplates.placeholderAlwaysHint',
              'These recipient fields work in every template, no matter which purpose is selected.'
            )}
          />
          <PlaceholderGroup>
            {renderPlaceholders(ALWAYS_PLACEHOLDERS, 'person')}
          </PlaceholderGroup>

          <Box sx={{ marginTop: 2.5 }}>
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
                <GroupHeading
                  title={t(selectedContext.titleKey, selectedContext.title)}
                  hint={
                    selectedContext.note ?
                      t(
                        `mailTemplates.placeholderContextNotes.${selectedContext.id}`,
                        selectedContext.note
                      )
                    : undefined
                  }
                />
                {selectedContext.placeholders.length > 0 ?
                  <PlaceholderGroup>
                    {renderPlaceholders(
                      selectedContext.placeholders,
                      'general'
                    )}
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
