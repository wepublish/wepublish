'use client';

import styled from '@emotion/styled';
import GearIcon from '@rsuite/icons/Gear';
import {
  getApiClientV2,
  TeaserListBlockSort,
  TeaserSlotsAutofillConfigInput,
  TeaserType,
  useTagListQuery,
} from '@wepublish/editor/api-v2';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Panel, Tag, Toggle } from 'rsuite';

import { TeaserSlotsAutofillDialog } from './teaser-slots-autofill-dialog';

interface TeaserSlotsContorlsProps {
  config: TeaserSlotsAutofillConfigInput;
  loadedTeasers: number;
  autofillSlots: number;
  onConfigChange: (config: TeaserSlotsAutofillConfigInput) => void;
}

const ControlsContainer = styled(Panel)`
  margin-bottom: 16px;
  border-radius: 6px;
  background-color: #f9fafb;
  padding: 12px;
`;

const ControlsSection = styled('div')`
  align-items: center;
  display: flex;
  gap: 15px;
`;

const ControlsLabel = styled.span`
  margin-right: 8px;
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

  const client = getApiClientV2();
  const { data: tagsData, refetch } = useTagListQuery({
    client,
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
      teaserType: TeaserType.Article,
    });
    setConfigDialogOpen(false);
    refetch({ filter: { tag: newConfig.filter?.tags?.join(' ') } });
  };

  const handleConfigCancel = () => {
    setConfigDialogOpen(false);
  };

  return (
    <ControlsContainer bordered>
      <ControlsSection>
        <div>
          <ControlsLabel>{t('blocks.teaserSlots.autoLoading')}</ControlsLabel>
          <Toggle
            checked={config.enabled}
            onChange={handleToggleChange}
            size="md"
          />
          <ControlsLabel style={{ marginLeft: '8px' }}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </ControlsLabel>

          {config.enabled && (
            <Button
              appearance="ghost"
              size="sm"
              onClick={() => setConfigDialogOpen(true)}
              style={{ marginLeft: '8px' }}
            >
              <GearIcon style={{ marginRight: '4px' }} />
              {t('blocks.teaserSlots.configure')}
            </Button>
          )}
        </div>
        <SummarySection>
          {config.enabled ?
            <>
              {tagsData?.tags && tagsData.tags.nodes.length > 0 ?
                <TagsContainer>
                  {tagsData.tags.nodes
                    .filter(tag => config.filter?.tags?.includes(tag.id))
                    .map((tag, index) => (
                      <Tag
                        key={index}
                        color="blue"
                      >
                        {tag.tag}
                      </Tag>
                    ))}
                </TagsContainer>
              : <Tag color="green">{t('blocks.teaserSlots.latest')}</Tag>}
              <span style={{ marginLeft: '8px' }}>
                {loadedTeasers}
                {loadedTeasers < autofillSlots ? `/${autofillSlots}` : ``}{' '}
                {t('blocks.teaserSlots.teasersLoaded')}{' '}
              </span>
            </>
          : <span style={{ color: '#6b7280' }}>
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
    </ControlsContainer>
  );
}
