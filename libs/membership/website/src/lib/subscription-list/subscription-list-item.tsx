import styled from '@emotion/styled';
import { SubscriptionDeactivationReason } from '@wepublish/website/api';
import {
  BuilderSubscriptionListItemProps,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useState } from 'react';
import {
  MdAttachMoney,
  MdAutorenew,
  MdCalendarMonth,
  MdCancel,
  MdHistory,
  MdOutlinePayments,
  MdTimelapse,
} from 'react-icons/md';
import { formatCurrency } from '../formatters/format-currency';
import {
  formatPaymentPeriod,
  formatPaymentTimeline,
} from '../formatters/format-payment-period';
import { Modal } from '@wepublish/website/builder';
import { Trans, useTranslation } from 'react-i18next';

export const SubscriptionListItemWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  overflow: hidden;
  container-type: inline-size;
`;

export const SubscriptionListItemContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
`;

export const SubscriptionListItemMeta = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const SubscriptionListItemMetaItem = styled('li')`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

// Used to hide it on demand by medias
export const SubscriptionListItemPaymentPeriodicity = styled(
  SubscriptionListItemMetaItem
)``;

export const SubscriptionListItemActions = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};

  @container (min-width: 35ch) {
    display: flex;
    justify-content: space-between;
  }
`;

const isURL = (string: string) => {
  try {
    new URL(string);

    return true;
  } catch (err) {
    return false;
  }

  return false;
};

export const SubscriptionListItemReward = styled('div')``;

export function SubscriptionListItem({
  autoRenew,
  startsAt,
  paidUntil,
  paymentPeriodicity,
  monthlyAmount,
  deactivation,
  memberPlan: { image, name, currency, productType },
  extendable,
  url,
  cancel,
  canExtend,
  externalReward,
  extend,
  className,
}: BuilderSubscriptionListItemProps) {
  const {
    meta: { locale },
    elements: { Image, H6, Button, Link, Alert, H5, Paragraph },
    date,
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);

  const periodicityTimeline = formatPaymentTimeline(paymentPeriodicity);
  const subscriptionDuration = formatPaymentPeriod(paymentPeriodicity);

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmExtend, setConfirmExtend] = useState<boolean>(false);

  return (
    <SubscriptionListItemWrapper className={className}>
      {image && <Image image={image} />}

      <SubscriptionListItemContent>
        <H6>{name}</H6>

        <SubscriptionListItemMeta>
          <SubscriptionListItemMetaItem>
            <MdCalendarMonth />

            <span>
              <Trans
                i18nKey="subscription.startsAt"
                values={{
                  type: productType,
                  startsAt: date.format(new Date(startsAt)),
                }}
                components={{
                  time: (
                    <time
                      suppressHydrationWarning
                      dateTime={startsAt}
                    />
                  ),
                }}
              />
            </span>
          </SubscriptionListItemMetaItem>

          {paidUntil && (
            <SubscriptionListItemMetaItem>
              <MdOutlinePayments />
              <span>
                Bezahlt bis{' '}
                <time
                  suppressHydrationWarning
                  dateTime={paidUntil}
                >
                  {date.format(new Date(paidUntil))}
                </time>
              </span>
            </SubscriptionListItemMetaItem>
          )}

          {deactivation && (
            <>
              <SubscriptionListItemMetaItem>
                <MdCancel />
                <span>
                  Gekündigt am{' '}
                  <time
                    suppressHydrationWarning
                    dateTime={deactivation.date}
                  >
                    {date.format(new Date(deactivation.date))}
                  </time>
                </span>
              </SubscriptionListItemMetaItem>

              {deactivation.reason ===
                SubscriptionDeactivationReason.InvoiceNotPaid && (
                <SubscriptionListItemMetaItem>
                  <MdCancel /> Automatisch gekündigt
                </SubscriptionListItemMetaItem>
              )}

              {deactivation.reason === SubscriptionDeactivationReason.None && (
                <SubscriptionListItemMetaItem>
                  <MdCancel /> Kündigungsgrund ist unbekannt.
                </SubscriptionListItemMetaItem>
              )}
            </>
          )}

          {!paidUntil && (
            <SubscriptionListItemMetaItem>
              <MdOutlinePayments />

              {t('subscription.unpaid', {
                type: productType,
              })}
            </SubscriptionListItemMetaItem>
          )}

          {autoRenew && (
            <SubscriptionListItemMetaItem>
              <MdAutorenew /> Wird automatisch {periodicityTimeline} erneuert
            </SubscriptionListItemMetaItem>
          )}

          {!autoRenew && (
            <SubscriptionListItemPaymentPeriodicity>
              <MdTimelapse /> Gültig für {subscriptionDuration}
            </SubscriptionListItemPaymentPeriodicity>
          )}

          <SubscriptionListItemMetaItem>
            <MdAttachMoney /> Kostet{' '}
            {formatCurrency(monthlyAmount / 100, currency, locale)}{' '}
            {extendable ? 'pro Monat' : ''}
          </SubscriptionListItemMetaItem>

          <SubscriptionListItemMetaItem>
            <MdHistory /> <Link href={url}>Details & Zahlungen</Link>
          </SubscriptionListItemMetaItem>
        </SubscriptionListItemMeta>

        {externalReward && (
          <SubscriptionListItemReward>
            <Alert severity="info">
              {isURL(externalReward) ?
                <Link
                  href={externalReward}
                  target="_blank"
                >
                  {t('subscription.externalReward', {
                    isLink: true,
                    externalReward,
                  })}
                </Link>
              : t('subscription.externalReward', {
                  isLink: false,
                  externalReward,
                })
              }
            </Alert>
          </SubscriptionListItemReward>
        )}

        {error && <Alert severity="error">{error.message}</Alert>}

        {!deactivation && (
          <SubscriptionListItemActions>
            {(extendable || !paidUntil) && (
              <Button
                onClick={() => setConfirmCancel(true)}
                disabled={loading}
                variant="text"
                color="secondary"
              >
                {t('subscription.cancel', {
                  type: productType,
                })}
              </Button>
            )}

            {canExtend && (
              <Button
                onClick={() => setConfirmExtend(true)}
                disabled={loading}
              >
                Jetzt verlängern
              </Button>
            )}
          </SubscriptionListItemActions>
        )}
      </SubscriptionListItemContent>

      <Modal
        open={!!confirmCancel}
        onSubmit={async () => {
          setConfirmCancel(false);
          await callAction(cancel)();
        }}
        onCancel={() => setConfirmCancel(false)}
        submitText={t('subscription.cancel', {
          type: productType,
        })}
      >
        <H5 component="h1">{name} wirklich kündigen?</H5>

        <Paragraph gutterBottom={false}>
          {t('subscription.cancelConfirmation', {
            type: productType,
          })}
        </Paragraph>
      </Modal>

      <Modal
        open={confirmExtend}
        onCancel={() => setConfirmExtend(false)}
        onSubmit={async () => {
          setConfirmExtend(false);
          await callAction(extend)();
        }}
        submitText={`Jetzt um ${subscriptionDuration} verlängern`}
      >
        <H5 component="h1">
          {t('subscription.extendEarly', {
            type: productType,
          })}
        </H5>

        <Paragraph gutterBottom={false}>
          {t('subscription.extendEarlyConfirmation', {
            subscriptionDuration,
          })}
        </Paragraph>
      </Modal>
    </SubscriptionListItemWrapper>
  );
}
