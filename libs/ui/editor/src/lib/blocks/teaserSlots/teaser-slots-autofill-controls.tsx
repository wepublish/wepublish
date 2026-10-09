'use client';

import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card as MuiCard,
  CardContent,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import GearIcon from '@rsuite/icons/Gear';
import {
  TagListDocument,
  TeaserListBlockSort,
  TeaserSlotsAutofillConfigInput,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { InfoTooltip } from '../../atoms/infoTooltip';
import { TeaserSlotsAutofillDialog } from './teaser-slots-autofill-dialog';

interface TeaserSlotsContorlsProps {
  config: TeaserSlotsAutofillConfigInput;
  loadedTeasers: number;
  autofillSlots: number;
  onConfigChange: (config: TeaserSlotsAutofillConfigInput) => void;
}

const ControlsContainer = styled(MuiCard)`
  margin-bottom: 16px;
  border-radius: var(--rs-radius-lg);
  background-color: var(--rs-bg-well);
  padding: 12px;
`;

const ControlsSection = styled('div')`
  align-items: center;
  display: flex;
  gap: 16px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummarySection = styled.div``;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
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

  return (
    <ControlsContainer>
      <CardContent>
        <CardContent>
          <ControlsSection>
            <ToggleRow>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enabled}
                    onChange={(_event, checked) => handleToggleChange(checked)}
                  />
                }
                label={
                  <>
                    {t('blocks.teaserSlots.autoLoadingToggle')}{' '}
                    <InfoTooltip
                      text={t('blocks.teaserSlots.autoLoadingHelp')}
                    />
                  </>
                }
              />

              {config.enabled && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setConfigDialogOpen(true)}
                >
                  <GearIcon style={{ marginRight: '4px' }} />
                  {t('blocks.teaserSlots.configure')}
                </Button>
              )}
            </ToggleRow>
            <SummarySection>
              {config.enabled ?
                <>
                  {tagsData?.tags && tagsData.tags.nodes.length > 0 ?
                    <TagsContainer>
                      {tagsData.tags.nodes
                        .filter(tag => config.filter?.tags?.includes(tag.id))
                        .map((tag, index) => (
                          <Chip
                            key={index}
                            color="primary"
                            label={tag.tag}
                          />
                        ))}
                    </TagsContainer>
                  : <Chip
                      color="success"
                      label={t('blocks.teaserSlots.latest')}
                    />
                  }
                  <span style={{ marginLeft: '8px' }}>
                    {loadedTeasers}
                    {loadedTeasers < autofillSlots ?
                      `/${autofillSlots}`
                    : ``}{' '}
                    {t('blocks.teaserSlots.teasersLoaded')}{' '}
                  </span>
                </>
              : <span style={{ color: 'var(--rs-text-secondary)' }}>
                  {t('blocks.teaserSlots.fillManually')}
                </span>
              }
            </SummarySection>
          </ControlsSection>

          <TeaserSlotsAutofillDialog
            open={configDialogOpen}
            onOpenChange={setConfigDialogOpen}
            config={config}
            onSave={handleConfigSave}
            onCancel={handleConfigCancel}
          />
        </CardContent>
      </CardContent>
    </ControlsContainer>
  );
}
