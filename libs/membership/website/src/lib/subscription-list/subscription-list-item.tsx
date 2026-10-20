import styled from '@emotion/styled';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { SubscriptionDeactivationReason } from '@wepublish/website/api';
import {
  BuilderSubscriptionListItemProps,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo, useState } from 'react';
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
import { calculatePeriodAmount } from '../formatters/format-payment-period';
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

export const SubscriptionListItemPaymentMethods = styled('div')`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

export function SubscriptionListItem({
  autoRenew,
  startsAt,
  paidUntil,
  paymentPeriodicity,
  monthlyAmount,
  deactivation,
  memberPlan: { image, name, currency, productType, availablePaymentMethods },
  paymentMethod,
  extendable,
  url,
  cancel,
  reactivate,
  revertUpgrade,
  canRevertUpgrade,
  canExtend,
  externalReward,
  extend,
  allowPaymentMethodChoice,
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

  const periodicityTimeline = t(
    `subscription.paymentTimeline.${paymentPeriodicity || 'yearly'}`
  );
  const subscriptionDuration = t(
    `subscription.paymentPeriod.${paymentPeriodicity || 'yearly'}`
  );

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReactivate, setConfirmReactivate] = useState(false);
  const [confirmRevertUpgrade, setConfirmRevertUpgrade] = useState(false);
  const [confirmExtend, setConfirmExtend] = useState<boolean>(false);

  // The subscription's current payment method plus the plan's methods for its
  // billing period, so the reader can e.g. switch from invoice to online
  // payment when extending early. The current one stays on the list even when
  // the plan no longer offers it to new subscribers; keeping it needs no switch.
  const paymentMethodOptions = useMemo(() => {
    if (!allowPaymentMethodChoice) {
      return [];
    }

    const options = [
      ...(paymentMethod ? [paymentMethod] : []),
      ...(availablePaymentMethods ?? [])
        .filter(
          ({ paymentPeriodicities, forceAutoRenewal }) =>
            (!paymentPeriodicity ||
              paymentPeriodicities.includes(paymentPeriodicity)) &&
            (!forceAutoRenewal || autoRenew)
        )
        .flatMap(({ paymentMethods }) => paymentMethods),
    ];

    return options.filter(
      (option, index) =>
        options.findIndex(({ id }) => id === option.id) === index
    );
  }, [
    allowPaymentMethodChoice,
    paymentMethod,
    availablePaymentMethods,
    paymentPeriodicity,
    autoRenew,
  ]);
  const showPaymentMethodChoice = paymentMethodOptions.length > 1;
  const [chosenPaymentMethodId, setChosenPaymentMethodId] = useState(
    paymentMethod?.id
  );
  const selectedPaymentMethodId =
    paymentMethodOptions.some(({ id }) => id === chosenPaymentMethodId) ?
      chosenPaymentMethodId
    : paymentMethodOptions[0]?.id;

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
                {t('subscription.paidUntil')}{' '}
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
                  {t('subscription.cancelledOn')}{' '}
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
                  <MdCancel /> {t('subscription.cancelledDueToInvoiceNotPaid')}
                </SubscriptionListItemMetaItem>
              )}

              {deactivation.reason === SubscriptionDeactivationReason.None && (
                <SubscriptionListItemMetaItem>
                  <MdCancel /> {t('subscription.cancelledDueToUnknownReason')}
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
              <MdAutorenew />{' '}
              {t('subscription.autoRenew', {
                periodicityTimeline,
              })}
            </SubscriptionListItemMetaItem>
          )}

          {!autoRenew && (
            <SubscriptionListItemPaymentPeriodicity>
              <MdTimelapse />{' '}
              {t('subscription.validFor', {
                subscriptionDuration,
              })}
            </SubscriptionListItemPaymentPeriodicity>
          )}

          <SubscriptionListItemMetaItem>
            <MdAttachMoney />
            {t('subscription.costs', {
              amount: formatCurrency(
                calculatePeriodAmount(monthlyAmount, paymentPeriodicity) / 100,
                currency,
                locale
              ),
              extendable,
              periodicity: paymentPeriodicity,
            })}
          </SubscriptionListItemMetaItem>

          <SubscriptionListItemMetaItem>
            <MdHistory />{' '}
            <Link href={url}>{t('subscription.detailsAndPayments')}</Link>
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

        {canRevertUpgrade && revertUpgrade && (
          <SubscriptionListItemActions>
            <Button
              onClick={() => setConfirmRevertUpgrade(true)}
              disabled={loading}
            >
              {t('subscription.revertUpgrade')}
            </Button>
          </SubscriptionListItemActions>
        )}

        {deactivation && !canRevertUpgrade && reactivate && (
          <SubscriptionListItemActions>
            <Button
              onClick={() => setConfirmReactivate(true)}
              disabled={loading}
            >
              {t('subscription.reactivate', {
                type: productType,
              })}
            </Button>
          </SubscriptionListItemActions>
        )}

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
                {t('subscription.extendNow')}
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
        cancelText={t('user.cancel')}
      >
        <H5 component="h1">
          {t('subscription.cancelProduct', {
            productName: productType,
          })}
        </H5>

        <Paragraph gutterBottom={false}>
          {t('subscription.cancelConfirmation', {
            type: productType,
          })}
        </Paragraph>
      </Modal>

      <Modal
        open={confirmRevertUpgrade}
        onSubmit={async () => {
          setConfirmRevertUpgrade(false);
          await callAction(revertUpgrade)();
        }}
        onCancel={() => setConfirmRevertUpgrade(false)}
        submitText={t('subscription.revertUpgrade')}
        cancelText={t('user.cancel')}
      >
        <H5 component="h1">{t('subscription.revertUpgradeTitle')}</H5>

        <Paragraph gutterBottom={false}>
          {t('subscription.revertUpgradeConfirmation', {
            type: productType,
          })}
        </Paragraph>
      </Modal>

      <Modal
        open={confirmReactivate}
        onSubmit={async () => {
          setConfirmReactivate(false);
          await callAction(reactivate)();
        }}
        onCancel={() => setConfirmReactivate(false)}
        submitText={t('subscription.reactivate', {
          type: productType,
        })}
        cancelText={t('user.cancel')}
      >
        <H5 component="h1">
          {t('subscription.reactivateProduct', {
            productName: productType,
          })}
        </H5>

        <Paragraph gutterBottom={false}>
          {t('subscription.reactivateConfirmation', {
            type: productType,
          })}
        </Paragraph>
      </Modal>

      <Modal
        open={confirmExtend}
        onCancel={() => setConfirmExtend(false)}
        onSubmit={async () => {
          setConfirmExtend(false);
          await callAction(async () => {
            await extend?.(
              // only a switch needs a method: the API checks it against the plan
              (
                showPaymentMethodChoice &&
                  selectedPaymentMethodId !== paymentMethod?.id
              ) ?
                selectedPaymentMethodId
              : undefined
            );
          })();
        }}
        submitText={t('subscription.extendBy', {
          subscriptionDuration,
        })}
        cancelText={t('user.cancel')}
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

        {showPaymentMethodChoice && (
          <SubscriptionListItemPaymentMethods>
            <Paragraph gutterBottom={false}>
              {t('subscription.extendPaymentMethod')}
            </Paragraph>

            <RadioGroup
              aria-label={t('subscription.extendPaymentMethod')}
              value={selectedPaymentMethodId}
              onChange={(_, value) => setChosenPaymentMethodId(value)}
            >
              {paymentMethodOptions.map(({ id, name }) => (
                <FormControlLabel
                  key={id}
                  value={id}
                  control={<Radio />}
                  label={name}
                />
              ))}
            </RadioGroup>
          </SubscriptionListItemPaymentMethods>
        )}
      </Modal>
    </SubscriptionListItemWrapper>
  );
}
