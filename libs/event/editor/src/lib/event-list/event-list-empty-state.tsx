import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

import {
  activeEventFilterCount,
  EventListFilterState,
  isOnlyReviewQueue,
} from './event-list-filter';

const Wrapper = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  max-width: 60ch;
  margin: 0 auto;
  text-align: center;
`;

const Title = styled.span`
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.vars.palette.text.primary};
`;

const Body = styled.span`
  display: block;
`;

export interface EventListEmptyStateProps {
  filter: EventListFilterState;
  canSeeAll?: boolean;
  hasMembership?: boolean;
  canCreate?: boolean;
  onClearFilters(): void;
}

export function EventListEmptyState({
  filter,
  canSeeAll,
  hasMembership,
  canCreate,
  onClearFilters,
}: EventListEmptyStateProps) {
  const { t } = useTranslation();
  const search = filter.search?.trim();

  if (isOnlyReviewQueue(filter)) {
    return (
      <Wrapper>
        <Title>{t('agenda.list.empty.queueEmptyTitle')}</Title>
        <Body>{t('agenda.list.empty.queueEmptyBody')}</Body>
      </Wrapper>
    );
  }

  if (activeEventFilterCount(filter) > 0) {
    return (
      <Wrapper>
        <Title>{t('agenda.list.empty.noResultsTitle')}</Title>
        {search && (
          <Body>{t('agenda.list.empty.noResultsSearch', { search })}</Body>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={onClearFilters}
        >
          {t('agenda.list.empty.clearFilters')}
        </Button>
      </Wrapper>
    );
  }

  const withoutMembership = canSeeAll === false && hasMembership === false;

  if (withoutMembership && canCreate === false) {
    return (
      <Wrapper>
        <Title>{t('agenda.list.empty.noMembershipTitle')}</Title>
        <Body>{t('agenda.list.empty.noMembershipBody')}</Body>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Title>{t('agenda.list.empty.noEventsTitle')}</Title>
      <Body>{t('agenda.list.empty.noEventsBody')}</Body>
      {withoutMembership && (
        <Body>{t('agenda.list.empty.noEventsMembershipHint')}</Body>
      )}
    </Wrapper>
  );
}
