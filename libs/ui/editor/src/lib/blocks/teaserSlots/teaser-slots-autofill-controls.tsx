'use client';

import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Typography,
} from '@mui/material';
import {
  TagListDocument,
  TeaserListBlockSort,
  TeaserSlotsAutofillConfigInput,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSettings } from 'react-icons/md';

import { InfoTooltip } from '../../atoms/infoTooltip';
import { TeaserSlotsAutofillDialog } from './teaser-slots-autofill-dialog';

interface TeaserSlotsContorlsProps {
  config: TeaserSlotsAutofillConfigInput;
  loadedTeasers: number;
  autofillSlots: number;
  onConfigChange: (config: TeaserSlotsAutofillConfigInput) => void;
}

const ControlsContainer = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1, 2)};
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(1, 2, 1, 1)};
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

const Summary = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  min-width: 0;
`;

const SummaryText = styled(Typography)`
  padding-left: ${({ theme }) => theme.spacing(5.25)};
`;

const TagsContainer = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding-left: ${({ theme }) => theme.spacing(5.25)};
`;

export function TeaserSlotsAutofillControls({
  config,
  autofillSlots,
  loadedTeasers,
  onConfigChange,
}: TeaserSlotsContorlsProps) {
  const { t } = useTranslation();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const { data: tagsData, refetch } = useQuery(TagListDocument, {
    skip: !config.filter?.tags?.length,
  });

  const handleToggleChange = (checked: boolean) => {
    if (!checked) {
      onConfigChange({
        ...config,
        enabled: false,
      });
    } else {
      setConfigDialogOpen(true);
    }
  };

  const handleConfigSave = (newConfig: TeaserSlotsAutofillConfigInput) => {
    onConfigChange({
      ...newConfig,
      enabled: true,
      sort: TeaserListBlockSort.PublishedAt,
      teaserType: newConfig.teaserType,
    });
    setConfigDialogOpen(false);
    refetch({ filter: { tag: newConfig.filter?.tags?.join(' ') } });
  };

  const handleConfigCancel = () => {
    setConfigDialogOpen(false);
  };

  const selectedTags =
    tagsData?.tags?.nodes.filter(tag =>
      config.filter?.tags?.includes(tag.id)
    ) ?? [];

  return (
    <ControlsContainer>
      <Summary>
        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Checkbox
              checked={config.enabled}
              onChange={(_event, checked) => handleToggleChange(checked)}
            />
          }
          label={
            <>
              {t('blocks.teaserSlots.autoLoadingToggle')}{' '}
              <InfoTooltip text={t('blocks.teaserSlots.autoLoadingHelp')} />
            </>
          }
        />

        <SummaryText
          variant="caption"
          color="text.secondary"
        >
          {config.enabled ?
            <>
              {loadedTeasers}
              {loadedTeasers < autofillSlots ? `/${autofillSlots}` : ''}{' '}
              {t('blocks.teaserSlots.teasersLoaded')}
            </>
          : t('blocks.teaserSlots.fillManually')}
        </SummaryText>

        {config.enabled && (
          <TagsContainer>
            {selectedTags.length ?
              selectedTags.map(tag => (
                <Chip
                  key={tag.id}
                  size="small"
                  color="primary"
                  label={tag.tag}
                />
              ))
            : <Chip
                size="small"
                color="success"
                label={t('blocks.teaserSlots.latest')}
              />
            }
          </TagsContainer>
        )}
      </Summary>

      {config.enabled && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<MdSettings />}
          onClick={() => setConfigDialogOpen(true)}
        >
          {t('blocks.teaserSlots.configure')}
        </Button>
      )}

      <TeaserSlotsAutofillDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        config={config}
        onSave={handleConfigSave}
        onCancel={handleConfigCancel}
      />
    </ControlsContainer>
  );
}
