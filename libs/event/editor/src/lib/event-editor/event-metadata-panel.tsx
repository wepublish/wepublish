import styled from '@emotion/styled';
import { Box, Button, Tab, Tabs } from '@mui/material';
import { EditorEventFragment } from '@wepublish/editor/api';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '@wepublish/ui/editor';
import { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEvent, MdPayments, MdSettings, MdShare } from 'react-icons/md';

import { EventDatesTab } from './event-dates-tab';
import { EventGeneralTab } from './event-general-tab';
import { EventPricingTab } from './event-pricing-tab';
import { EventSocialTab } from './event-social-tab';

export const EVENT_METADATA_TABS = [
  'general',
  'dates',
  'pricing',
  'social',
] as const;

export type EventMetadataTab = (typeof EVENT_METADATA_TABS)[number];

export const isEventMetadataTab = (
  value: string | null
): value is EventMetadataTab =>
  EVENT_METADATA_TABS.includes(value as EventMetadataTab);

const TAB_ICONS: Record<EventMetadataTab, ReactElement> = {
  general: <MdSettings />,
  dates: <MdEvent />,
  pricing: <MdPayments />,
  social: <MdShare />,
};

const Fieldset = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
`;

export interface EventMetadataPanelProps {
  tab: EventMetadataTab;
  event: EditorEventFragment | undefined;
  now: Date;
  readOnly: boolean;
  busy: boolean;
  notice?: ReactNode;
  onTabChange(tab: EventMetadataTab): void;
  onSave(): void;
  onSaveAndClose(): void;
  onClose(): void;
}

export function EventMetadataPanel({
  tab,
  event,
  now,
  readOnly,
  busy,
  notice,
  onTabChange,
  onSave,
  onSaveAndClose,
  onClose,
}: EventMetadataPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('agenda.editor.metadata')}</DrawerTitle>

        <DrawerActions>
          {readOnly ?
            <Button
              variant="outlined"
              onClick={onClose}
            >
              {t('close')}
            </Button>
          : <>
              <Button
                variant="outlined"
                disabled={busy}
                onClick={onSave}
              >
                {t('save')}
              </Button>
              <Button
                variant="contained"
                disabled={busy}
                onClick={onSaveAndClose}
              >
                {t('saveAndClose')}
              </Button>
            </>
          }
        </DrawerActions>
      </DrawerHeader>

      <Tabs
        value={tab}
        onChange={(_event, next: EventMetadataTab) => onTabChange(next)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {EVENT_METADATA_TABS.map(key => (
          <Tab
            key={key}
            value={key}
            icon={TAB_ICONS[key]}
            iconPosition="start"
            label={t(`agenda.editor.tabs.${key}`)}
          />
        ))}
      </Tabs>

      <DrawerBody>
        {notice && <Box sx={{ mb: 3 }}>{notice}</Box>}

        <Fieldset disabled={readOnly}>
          {tab === 'general' && <EventGeneralTab event={event} />}
          {tab === 'dates' && (
            <EventDatesTab
              eventId={event?.id}
              now={now}
            />
          )}
          {tab === 'pricing' && <EventPricingTab />}
          {tab === 'social' && <EventSocialTab event={event} />}
        </Fieldset>
      </DrawerBody>
    </>
  );
}
