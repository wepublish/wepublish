import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  BuilderSubscriptionListItemProps,
  Link,
} from '@wepublish/website/builder';

import { eenewsColors } from '../theme';

const Row = styled(Link)`
  display: grid;
  grid-template-columns: 1.4fr repeat(3, 1fr) auto;
  gap: 16px;
  padding: 22px 0;
  align-items: center;
  border-bottom: 1px solid ${eenewsColors.line};
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(25, 90, 125, 0.04);
  }
  &:last-child {
    border-bottom: 0;
  }
  ${({ theme }) => theme.breakpoints.down('md')} {
    grid-template-columns: 1fr 1fr;
  }
`;

const Name = styled(Typography)`
  display: block;
  color: ${eenewsColors.accent};
  margin: 0 0 4px;
`;

const Meta = styled(Typography)`
  display: block;
  color: ${eenewsColors.muted};
`;

const Label = styled(Typography)`
  display: block;
  color: ${eenewsColors.muted};
  margin-bottom: 4px;
`;

const Value = styled(Typography)`
  display: block;
  color: ${eenewsColors.accent};
`;

const Arrow = styled('span')`
  width: 32px;
  height: 32px;
  border: 1.5px solid ${eenewsColors.accent};
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: ${eenewsColors.accent};
  transition:
    background 0.15s,
    color 0.15s;
  ${Row}:hover & {
    background: ${eenewsColors.accent};
    color: ${eenewsColors.white};
  }
  ${({ theme }) => theme.breakpoints.down('md')} {
    display: none;
  }
`;

const formatDateDE = (raw: string | null | undefined): string => {
  if (!raw) {
    return '';
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const EenewsSubscriptionListItem = ({
  className,
  id,
  memberPlan,
  monthlyAmount,
  paymentPeriodicity,
  paidUntil,
  startsAt,
}: BuilderSubscriptionListItemProps) => {
  const amountChf = (monthlyAmount / 100).toFixed(2);
  return (
    <Row
      className={className}
      href={`/profile/subscription/${id}`}
    >
      <div>
        <Name variant="articleH2">{memberPlan.name}</Name>
        <Meta variant="teaserMeta">
          {paymentPeriodicity} · seit {formatDateDE(startsAt)}
        </Meta>
      </div>
      <div>
        <Label variant="inputLabel">Betrag</Label>
        <Value variant="teaserMeta">CHF {amountChf} / Monat</Value>
      </div>
      <div>
        <Label variant="inputLabel">Nächste Zahlung</Label>
        <Value variant="teaserMeta">{formatDateDE(paidUntil)}</Value>
      </div>
      <div></div>
      <Arrow>→</Arrow>
    </Row>
  );
};
