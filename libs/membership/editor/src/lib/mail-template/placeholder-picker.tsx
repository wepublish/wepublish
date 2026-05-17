import styled from '@emotion/styled';
import { Box, Chip, Stack, TextField, Typography } from '@mui/material';
import {
  MailTemplatePlaceholderGroupsQuery,
  PlaceholderScope,
  useMailTemplatePlaceholderGroupsQuery,
} from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_QUERY_OPTIONS } from '../common';

export interface PlaceholderPickerProps {
  syntax: { open: string; close: string };
  onInsert: (token: string) => void;
}

type Group =
  MailTemplatePlaceholderGroupsQuery['mailTemplatePlaceholderGroups'][number];

const ScrollableBox = styled(Box)`
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 8px;
`;

const GroupContainer = styled(Box)`
  margin-bottom: 16px;
`;

const ChipRow = styled(Stack)`
  flex-wrap: wrap;
  gap: 6px;
`;

const PickerChip = styled(Chip)`
  cursor: pointer;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
`;

const matchesFilter = (group: Group, term: string): boolean => {
  if (!term) {
    return true;
  }
  const lower = term.toLowerCase();
  if (group.event.toLowerCase().includes(lower)) {
    return true;
  }
  return group.placeholders.some(p => p.key.toLowerCase().includes(lower));
};

const filterPlaceholders = (group: Group, term: string) => {
  if (!term) {
    return group.placeholders;
  }
  const lower = term.toLowerCase();
  return group.placeholders.filter(p => p.key.toLowerCase().includes(lower));
};

export function PlaceholderPicker({
  syntax,
  onInsert,
}: PlaceholderPickerProps) {
  const { t } = useTranslation();
  const { data } = useMailTemplatePlaceholderGroupsQuery(
    DEFAULT_QUERY_OPTIONS()
  );
  const [filter, setFilter] = useState('');

  const groups = useMemo(() => {
    if (!data?.mailTemplatePlaceholderGroups) {
      return [];
    }
    return data.mailTemplatePlaceholderGroups.filter(g =>
      matchesFilter(g, filter)
    );
  }, [data, filter]);

  const buildToken = (key: string) => `${syntax.open}${key}${syntax.close}`;

  const groupTitle = (g: Group): string => {
    if (g.scope === PlaceholderScope.SubscriptionEvent) {
      return t(`subscriptionFlow.${g.event.toLowerCase()}`, {
        defaultValue: g.event,
      });
    }
    if (g.scope === PlaceholderScope.UserEvent) {
      return t(`systemMails.events.${g.event.toLowerCase()}`, {
        defaultValue: g.event,
      });
    }
    return g.event;
  };

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ mb: 1 }}
      >
        {t('mailTemplateEdit.placeholderPicker.title')}
      </Typography>
      <Typography
        variant="caption"
        sx={{ display: 'block', mb: 1 }}
        color="textSecondary"
      >
        {t('mailTemplateEdit.placeholderPicker.help')}
      </Typography>
      <TextField
        size="small"
        fullWidth
        placeholder={t('mailTemplateEdit.placeholderPicker.searchPlaceholder')}
        value={filter}
        onChange={e => setFilter(e.target.value)}
        sx={{ mb: 2 }}
      />

      <ScrollableBox>
        {groups.map(group => {
          const placeholders = filterPlaceholders(group, filter);
          if (placeholders.length === 0) {
            return null;
          }
          return (
            <GroupContainer key={`${group.scope}:${group.event}`}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1 }}
              >
                {groupTitle(group)}
              </Typography>
              <ChipRow direction="row">
                {placeholders.map(p => (
                  <PickerChip
                    key={p.key}
                    label={p.key}
                    variant="outlined"
                    size="small"
                    onClick={() => onInsert(buildToken(p.key))}
                    title={t(p.description, { defaultValue: p.key })}
                  />
                ))}
              </ChipRow>
            </GroupContainer>
          );
        })}
      </ScrollableBox>
    </Box>
  );
}
