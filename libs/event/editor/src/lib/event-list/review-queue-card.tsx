import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';
import { EventReviewQueueCountDocument } from '@wepublish/editor/api';
import {
  CanGetEvents,
  CanGetOtherOrganizationEvents,
  CanPublishEvent,
  CanUpdateOtherOrganizationEvents,
} from '@wepublish/permissions';
import { InfoTooltip, useAuthorisation } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdChevronRight } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

export const REVIEW_QUEUE_PATH = '/events?review=1';

export function useReviewQueueAccess() {
  const canList = useAuthorisation(CanGetEvents.id);
  const canPublish = useAuthorisation(CanPublishEvent.id);
  const canSeeOthers = useAuthorisation(CanGetOtherOrganizationEvents.id);
  const canUpdateOthers = useAuthorisation(CanUpdateOtherOrganizationEvents.id);

  if (canList === undefined) {
    return undefined;
  }

  return canList && !!(canPublish || canSeeOthers || canUpdateOthers);
}

const Count = styled(Typography)`
  font-variant-numeric: tabular-nums;
`;

export function ReviewQueueCard() {
  const { t } = useTranslation();
  const { data } = useQuery(EventReviewQueueCountDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const count = data?.events.totalCount;

  return (
    <Card>
      <CardHeader
        title={
          <>
            {t('agenda.reviewQueue.title')}{' '}
            <InfoTooltip text={t('agenda.reviewQueue.info')} />
          </>
        }
        slotProps={{ title: { variant: 'h2' } }}
        action={
          <Button
            component={RouterLink}
            to={REVIEW_QUEUE_PATH}
            variant="text"
            endIcon={<MdChevronRight />}
          >
            {t('agenda.reviewQueue.open')}
          </Button>
        }
      />

      <CardContent>
        <div aria-live="polite">
          {count !== undefined && (
            <Count variant="body1">
              {count > 0 ?
                t('agenda.reviewQueue.count', { count })
              : t('agenda.reviewQueue.empty')}
            </Count>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
