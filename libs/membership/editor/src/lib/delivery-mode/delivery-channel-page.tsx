import { useQuery } from '@apollo/client/react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { DeliverySuggestionCountsDocument } from '@wepublish/editor/api';
import {
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { EmailEvidenceNotice } from '../mail-send/email-evidence-notice';
import { DeliveryChannelOverviewView } from './delivery-channel-overview-view';
import { DeliveryChannelAssignView } from './delivery-channel-assign-view';
import { DeliveryChannelHistoryView } from './delivery-channel-history-view';
import { DeliverySuggestionsView } from './delivery-suggestions-view';
import { usePaperLetterFlow } from './use-paper-letter-flow';

type View = { key: string; label: string; element: ReactNode };

/**
 * One place for how automated messages reach each person: the views are
 * links, so each has an address of its own and the sidebar entry stays lit
 * on all of them. An address it does not know shows the first view.
 */
export function DeliveryChannelPage() {
  const { t } = useTranslation();
  const { view } = useParams();
  const flow = usePaperLetterFlow();
  const canManage = useAuthorisation('CAN_MANAGE_USER-DELIVERY-MODE');
  const { data } = useQuery(DeliverySuggestionCountsDocument);

  const counts = data?.deliverySuggestionCounts;
  const open = (counts?.toLetter ?? 0) + (counts?.toMail ?? 0);

  const views: View[] = [
    {
      key: 'overview',
      label: t('deliveryChannel.tabs.overview'),
      element: <DeliveryChannelOverviewView />,
    },
    {
      key: 'suggestions',
      label: t('deliveryChannel.tabs.suggestions', { count: open }),
      element: <DeliverySuggestionsView />,
    },
    ...(flow && canManage ?
      [
        {
          key: 'assign',
          label: t('deliveryChannel.tabs.assign'),
          element: <DeliveryChannelAssignView />,
        },
      ]
    : []),
    ...(canManage ?
      [
        {
          key: 'history',
          label: t('deliveryChannel.tabs.history'),
          element: <DeliveryChannelHistoryView />,
        },
      ]
    : []),
  ];
  const active = views.find(({ key }) => key === view) ?? views[0];

  return (
    // The editor's content frame is a scrolling flex column; a block with its
    // own overflow (tables, cards) would shrink and scroll inside it instead of
    // the page scrolling. Opt out of shrinking, like the other long pages.
    <div style={{ flexShrink: 0 }}>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('deliveryMode.suggestionsTitle')}</PageTitle>
        </ListViewHeader>
      </ListViewContainer>

      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', maxWidth: '80ch' }}
      >
        {t('deliveryMode.suggestionsIntro')}
      </Typography>

      {/* Suggestions are built from the email status; say when that status
          has nothing from the provider behind it. */}
      <EmailEvidenceNotice sx={{ marginTop: 2 }} />

      <Tabs
        value={active.key}
        sx={{ marginTop: 2, marginBottom: 2 }}
      >
        {views.map(({ key, label }) => (
          <Tab
            key={key}
            value={key}
            label={label}
            component={Link}
            to={`/deliverychannel/${key}`}
          />
        ))}
      </Tabs>

      <Box>{active.element}</Box>
    </div>
  );
}
