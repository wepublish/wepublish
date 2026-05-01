import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  BuilderSubscriptionListItemProps,
  BuilderSubscriptionListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';

import { eenewsColors } from '../theme';

type StatusVariant = 'active' | 'due' | 'cancelled';

const Row = styled('a')`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(
      0,
      1fr
    ) auto auto;
  align-items: center;
  gap: 24px;
  padding: 22px 28px;
  border-bottom: 1px solid ${eenewsColors.rule};
  color: ${eenewsColors.ink};
  text-decoration: none;
  cursor: pointer;
  transition: background 0.12s ease;

  &:last-of-type {
    border-bottom: none;
  }

  &:hover {
    background: ${eenewsColors.paperWarm};
  }
`;

const Pill = styled('span')<{ variant: StatusVariant }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: ${({ variant }) =>
    variant === 'active' ? eenewsColors.accent
    : variant === 'due' ? eenewsColors.alertSoft
    : eenewsColors.paperWarm};
  color: ${({ variant }) =>
    variant === 'due' ? eenewsColors.alertDeep : eenewsColors.ink};
`;

const Arrow = styled('span')`
  font-size: 18px;
  color: ${eenewsColors.inkSoft};
  line-height: 1;
`;

const formatPeriodSuffix = (periodicity: string) => {
  switch (periodicity.toLowerCase()) {
    case 'monthly':
      return '/ Monat';
    case 'quarterly':
      return '/ Quartal';
    case 'biannual':
      return '/ Halbjahr';
    case 'yearly':
      return '/ Jahr';
    case 'biennial':
      return '/ 2 Jahre';
    case 'lifetime':
      return 'einmalig';
    default:
      return '';
  }
};

const periodAmount = (
  monthlyAmount: number,
  periodicity: string,
  currency: string,
  locale: string
) => {
  const months: Record<string, number> = {
    monthly: 1,
    quarterly: 3,
    biannual: 6,
    yearly: 12,
    biennial: 24,
    lifetime: 1,
  };
  const factor = months[periodicity.toLowerCase()] ?? 1;
  const totalMajor = (monthlyAmount * factor) / 100;
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return `${formatter.format(totalMajor)} ${formatPeriodSuffix(periodicity)}`;
};

export function EenewsSubscriptionListItem(
  props: BuilderSubscriptionListItemProps
) {
  const {
    id,
    paymentPeriodicity,
    monthlyAmount,
    paidUntil,
    isActive,
    deactivation,
    memberPlan,
    className,
  } = props;
  const router = useRouter();
  const { meta, date } = useWebsiteBuilder();
  const locale = meta?.locale ?? 'de-CH';

  const variant: StatusVariant =
    deactivation ? 'cancelled'
    : isActive ? 'active'
    : 'due';

  const pillLabel =
    variant === 'active' ? 'Aktiv'
    : variant === 'due' ? 'Offen'
    : 'Gekündigt';

  const amountLabel = periodAmount(
    monthlyAmount,
    paymentPeriodicity,
    memberPlan.currency,
    locale
  );

  const nextLabel =
    deactivation ? `Endet am ${date.format(new Date(deactivation.date), false)}`
    : paidUntil ? `Nächste Zahlung ${date.format(new Date(paidUntil), false)}`
    : 'Zahlung ausstehend';

  return (
    <Row
      className={className}
      href={`/profile/subscription/${id}`}
      onClick={event => {
        event.preventDefault();
        router.push(`/profile/subscription/${id}`);
      }}
    >
      <Typography
        variant="bodyTeaserStandard"
        component="span"
        sx={{ fontWeight: 500, color: eenewsColors.ink }}
      >
        {memberPlan.name}
      </Typography>
      <Typography
        variant="metaInline"
        component="span"
        sx={{ color: eenewsColors.inkSoft }}
      >
        {amountLabel}
      </Typography>
      <Typography
        variant="metaInline"
        component="span"
        sx={{ color: eenewsColors.inkSoft }}
      >
        {nextLabel}
      </Typography>
      <Pill variant={variant}>{pillLabel}</Pill>
      <Arrow aria-hidden="true">→</Arrow>
    </Row>
  );
}

const ListBody = styled('div')`
  display: flex;
  flex-direction: column;
`;

const Empty = styled('div')`
  padding: 22px 28px;
  color: ${eenewsColors.inkSoft};
`;

export function EenewsSubscriptionList({
  data,
  loading,
  error,
  onCancel,
  onExtend,
  className,
  subscribeUrl,
}: BuilderSubscriptionListProps) {
  const {
    SubscriptionListItem,
    elements: { Alert, Link },
  } = useWebsiteBuilder();
  const subscriptions = data?.userSubscriptions ?? [];

  if (loading && subscriptions.length === 0) {
    return null;
  }

  return (
    <ListBody className={className}>
      {error ?
        <Alert severity="error">{error.message}</Alert>
      : null}
      {subscriptions.length === 0 && !loading && !error ?
        <Empty>
          Keine Mitgliedschaft.{' '}
          <Link href={subscribeUrl}>Jetzt mitmachen →</Link>
        </Empty>
      : null}
      {subscriptions.map(subscription => (
        <SubscriptionListItem
          key={subscription.id}
          {...subscription}
          extend={async () => await onExtend?.(subscription.id)}
          cancel={async () => await onCancel?.(subscription.id)}
        />
      ))}
    </ListBody>
  );
}
