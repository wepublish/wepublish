import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  BuilderInvoiceListItemProps,
  BuilderInvoiceListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Currency } from '@wepublish/website/api';
import { useState } from 'react';

import { eenewsColors } from '../theme';

type StatusVariant = 'paid' | 'due' | 'cancelled' | 'pending';

const Row = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  border-bottom: 1px solid ${eenewsColors.rule};
  color: ${eenewsColors.ink};

  &:last-of-type {
    border-bottom: none;
  }
`;

const InfoBlock = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1 1 auto;
`;

const ActionBlock = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
`;

const Meta = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  color: ${eenewsColors.inkSoft};
`;

const MetaSeparator = styled('span')`
  color: ${eenewsColors.inkSoft};
  opacity: 0.6;
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
    variant === 'paid' ? eenewsColors.accent
    : variant === 'due' ? eenewsColors.alertSoft
    : eenewsColors.paperWarm};
  color: ${({ variant }) =>
    variant === 'due' ? eenewsColors.alertDeep : eenewsColors.ink};
`;

const PayCta = styled('button')`
  appearance: none;
  background: ${eenewsColors.alert};
  color: ${eenewsColors.paper};
  border: none;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 12px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover {
    background: ${eenewsColors.alertDeep};
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;

const ListBody = styled('div')`
  display: flex;
  flex-direction: column;
`;

const Empty = styled('div')`
  padding: 22px 28px;
  color: ${eenewsColors.inkSoft};
`;

const formatInvoiceNumber = (id: string, createdAt: string) => {
  const year = new Date(createdAt).getFullYear();
  return `${year}-${id.slice(-6).toUpperCase()}`;
};

export function EenewsInvoiceListItem(props: BuilderInvoiceListItemProps) {
  const {
    id,
    total,
    paidAt,
    createdAt,
    canceledAt,
    dueAt,
    description,
    subscription,
    isSepa,
    isBexio,
    canPay,
    pay,
    className,
  } = props;

  const {
    meta,
    date,
    elements: { Alert },
  } = useWebsiteBuilder();
  const locale = meta?.locale ?? 'de-CH';
  const currency = subscription?.memberPlan.currency ?? Currency.Chf;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const variant: StatusVariant =
    paidAt ? 'paid'
    : canceledAt ? 'cancelled'
    : isSepa || isBexio ? 'pending'
    : 'due';

  const pillLabel =
    variant === 'paid' ? 'Bezahlt'
    : variant === 'cancelled' ? 'Storniert'
    : variant === 'pending' ? 'In Verarbeitung'
    : 'Offen';

  const desc =
    description ??
    (subscription ?
      `Mitgliedschaft ${subscription.memberPlan.name}`
    : 'Rechnung');

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  const dateLabel =
    paidAt ? date.format(new Date(paidAt), false)
    : canceledAt ? date.format(new Date(canceledAt), false)
    : date.format(new Date(dueAt), false);

  const handlePay = async () => {
    if (!pay) {
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await pay();
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const dateEyebrow =
    paidAt ? 'Bezahlt am'
    : canceledAt ? 'Storniert am'
    : 'Fällig am';

  return (
    <>
      <Row className={className}>
        <InfoBlock>
          <Typography
            variant="bodyTeaserStandard"
            component="span"
            sx={{
              color: eenewsColors.ink,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {desc}
          </Typography>
          <Meta>
            <Typography
              variant="metaInline"
              component="span"
            >
              {dateEyebrow} {dateLabel}
            </Typography>
            <MetaSeparator>·</MetaSeparator>
            <Typography
              variant="metaInline"
              component="span"
            >
              {formatInvoiceNumber(id, createdAt)}
            </Typography>
          </Meta>
        </InfoBlock>
        <ActionBlock>
          <Typography
            variant="bodyTeaserStandard"
            component="span"
            sx={{ color: eenewsColors.ink, fontWeight: 500 }}
          >
            {formatter.format(total / 100)}
          </Typography>
          {variant === 'due' && canPay ?
            <PayCta
              onClick={handlePay}
              disabled={loading}
            >
              Bezahlen →
            </PayCta>
          : <Pill variant={variant}>{pillLabel}</Pill>}
        </ActionBlock>
      </Row>
      {error ?
        <Alert severity="error">{error.message}</Alert>
      : null}
    </>
  );
}

export function EenewsInvoiceList({
  data,
  loading,
  error,
  onPay,
  className,
}: BuilderInvoiceListProps) {
  const {
    InvoiceListItem,
    elements: { Alert },
  } = useWebsiteBuilder();
  const invoices = data?.userInvoices ?? [];

  if (loading && invoices.length === 0) {
    return null;
  }

  return (
    <ListBody className={className}>
      {error ?
        <Alert severity="error">{error.message}</Alert>
      : null}
      {invoices.length === 0 && !loading && !error ?
        <Empty>Keine Rechnungen.</Empty>
      : null}
      {invoices.map(invoice => {
        const isSepa =
          invoice.subscription?.paymentMethod.description === 'sepa';
        const isBexio =
          invoice.subscription?.paymentMethod.slug.includes('bexio') ?? false;
        const isPayrexxSubscription =
          invoice.subscription?.paymentMethod.paymentProviderID ===
          'payrexx-subscription';
        const isActive =
          !invoice.canceledAt && !invoice.paidAt && !!invoice.subscription;
        const canPay = isActive && !isSepa && !isBexio;

        return (
          <InvoiceListItem
            key={invoice.id}
            {...invoice}
            isSepa={isSepa}
            isBexio={isBexio}
            isPayrexxSubscription={isPayrexxSubscription}
            canPay={canPay}
            pay={async () => {
              if (invoice.subscription) {
                await onPay?.(
                  invoice.id,
                  invoice.subscription.paymentMethod.id
                );
              }
            }}
          />
        );
      })}
    </ListBody>
  );
}
