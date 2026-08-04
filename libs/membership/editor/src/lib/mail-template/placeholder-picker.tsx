import { memo, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdExpandMore, MdSearch } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import {
  MailTemplatePlaceholdersQuery,
  useMailTemplatePlaceholdersQuery,
} from '@wepublish/editor/api';
import { DEFAULT_QUERY_OPTIONS } from '../common';

type PlaceholderGroup =
  MailTemplatePlaceholdersQuery['mailTemplatePlaceholders'][number];
type Placeholder = PlaceholderGroup['placeholders'][number];

const PickerContainer = styled(Box)`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 6px;
  background-color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ScrollArea = styled(Box)`
  overflow-y: auto;
  flex: 1;
`;

const PlaceholderKey = styled('span')`
  font-family: monospace;
  font-size: 13px;
`;

interface PlaceholderPickerProps {
  onInsert: (key: string) => void;
}

function PlaceholderPickerComponent({ onInsert }: PlaceholderPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data } = useMailTemplatePlaceholdersQuery(DEFAULT_QUERY_OPTIONS());

  const eventTitle = (event: string): string => {
    const lower = event.toLowerCase();
    return t(`subscriptionFlow.${lower}`, {
      defaultValue: t(`systemMails.events.${lower}`, {
        defaultValue: event,
      }),
    });
  };

  const describe = (key: string): string =>
    t(`placeholderList.description.${key}`, { defaultValue: '' });

  const { commonPlaceholders, eventGroups } = useMemo(() => {
    const groups = data?.mailTemplatePlaceholders ?? [];
    if (!groups.length) {
      return { commonPlaceholders: [] as Placeholder[], eventGroups: [] };
    }

    // Keys present in every event are "general" (user_*, jwt) and shown once.
    const keyCounts = new Map<string, number>();
    for (const group of groups) {
      for (const placeholder of group.placeholders) {
        keyCounts.set(
          placeholder.key,
          (keyCounts.get(placeholder.key) ?? 0) + 1
        );
      }
    }

    const isCommon = (key: string) => keyCounts.get(key) === groups.length;

    const commonMap = new Map<string, Placeholder>();
    for (const group of groups) {
      for (const placeholder of group.placeholders) {
        if (isCommon(placeholder.key) && !commonMap.has(placeholder.key)) {
          commonMap.set(placeholder.key, placeholder);
        }
      }
    }

    const eventGroups = groups
      .map(group => ({
        event: group.event,
        placeholders: group.placeholders.filter(p => !isCommon(p.key)),
      }))
      .filter(group => group.placeholders.length > 0);

    return {
      commonPlaceholders: [...commonMap.values()],
      eventGroups,
    };
  }, [data]);

  const filterPlaceholders = (placeholders: Placeholder[]): Placeholder[] => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return placeholders;
    }
    return placeholders.filter(
      p =>
        p.key.toLowerCase().includes(term) ||
        describe(p.key).toLowerCase().includes(term)
    );
  };

  const renderItem = (placeholder: Placeholder) => {
    const description = describe(placeholder.key);
    return (
      <Tooltip
        key={placeholder.key}
        title={t('mailTemplates.editor.exampleValue', {
          example: placeholder.example,
        })}
        placement="left"
      >
        <ListItemButton
          dense
          onClick={() => onInsert(placeholder.key)}
        >
          <ListItemText
            primary={<PlaceholderKey>{placeholder.key}</PlaceholderKey>}
            secondary={description || undefined}
          />
        </ListItemButton>
      </Tooltip>
    );
  };

  const commonFiltered = filterPlaceholders(commonPlaceholders);

  return (
    <PickerContainer>
      <Box sx={{ p: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ px: 1, py: 0.5 }}
        >
          {t('mailTemplates.editor.placeholders')}
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder={t('mailTemplates.editor.searchPlaceholders') ?? ''}
          value={search}
          onChange={event => setSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <ScrollArea>
        {commonFiltered.length > 0 && (
          <Accordion
            defaultExpanded
            disableGutters
          >
            <AccordionSummary expandIcon={<MdExpandMore />}>
              <Typography variant="subtitle2">
                {t('mailTemplates.editor.generalPlaceholders')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense>{commonFiltered.map(renderItem)}</List>
            </AccordionDetails>
          </Accordion>
        )}

        {eventGroups.map(group => {
          const filtered = filterPlaceholders(group.placeholders);
          if (!filtered.length) {
            return null;
          }
          return (
            <Accordion
              key={group.event}
              defaultExpanded={!!search}
              disableGutters
            >
              <AccordionSummary expandIcon={<MdExpandMore />}>
                <Typography variant="subtitle2">
                  {eventTitle(group.event)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List dense>{filtered.map(renderItem)}</List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </ScrollArea>
    </PickerContainer>
  );
}

export const PlaceholderPicker = memo(PlaceholderPickerComponent);
