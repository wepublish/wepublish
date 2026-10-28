import styled from '@emotion/styled';
import {
  FullSubscriptionFragment,
  SubscriptionDeactivationReason,
} from '@wepublish/website/api';
import {
  BuilderSubscriptionListItemProps,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo, useState } from 'react';
import {
  MdAttachMoney,
  MdCreditCard,
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

export const SubscriptionListItemPaymentMethodChange = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const AUTHORIZATION_AMOUNT = 1;

export const useChangeablePaymentMethods = ({
  paymentMethod,
  memberPlan,
  paymentPeriodicity,
  autoRenew,
}: Pick<
  FullSubscriptionFragment,
  'paymentMethod' | 'memberPlan' | 'paymentPeriodicity' | 'autoRenew'
>) =>
  useMemo(() => {
    const options = (memberPlan.availablePaymentMethods ?? [])
      .filter(
        ({ paymentPeriodicities, forceAutoRenewal }) =>
          paymentPeriodicities.includes(paymentPeriodicity) &&
          (!forceAutoRenewal || autoRenew)
      )
      .flatMap(({ paymentMethods }) => paymentMethods)
      .filter(
        ({ id, slug }) =>
          id !== paymentMethod?.id && slug !== 'payrexx-subscription'
      );

    return options.filter(
      (option, index) =>
        options.findIndex(({ id }) => id === option.id) === index
    );
  }, [memberPlan, paymentMethod, paymentPeriodicity, autoRenew]);

export function SubscriptionListItem({
  autoRenew,
  startsAt,
  paidUntil,
  paymentPeriodicity,
  monthlyAmount,
  deactivation,
  memberPlan,
  paymentMethod,
  pendingPaymentMethodChange,
  canRenewPaymentMethod,
  extendable,
  url,
  cancel,
  reactivate,
  revertUpgrade,
  canRevertUpgrade,
  canExtend,
  externalReward,
  extend,
  changePaymentMethod,
  cancelPaymentMethodChange,
  openInvoiceTotal,
  className,
}: BuilderSubscriptionListItemProps) {
  const { image, name, currency, productType } = memberPlan;
  const {
    meta: { locale },
    elements: { Image, H6, Button, Link, Alert, Paragraph },
    PaymentMethodPicker,
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
  const [confirmChangePaymentMethod, setConfirmChangePaymentMethod] =
    useState(false);
  const [confirmRenewPaymentMethod, setConfirmRenewPaymentMethod] =
    useState(false);

  const changeablePaymentMethods = useChangeablePaymentMethods({
    paymentMethod,
    memberPlan,
    paymentPeriodicity,
    autoRenew,
  });
  const [chosenPaymentMethodId, setChosenPaymentMethodId] = useState<string>();
  const canChangePaymentMethod =
    !!changePaymentMethod &&
    !deactivation &&
    !pendingPaymentMethodChange &&
    changeablePaymentMethods.length > 0;
  const canRenewCurrentPaymentMethod =
    !!changePaymentMethod &&
    !deactivation &&
    !pendingPaymentMethodChange &&
    !!canRenewPaymentMethod &&
    !!paymentMethod;

  const paymentMethodChangeExplanation =
    openInvoiceTotal ?
      t('subscription.changePaymentMethodOpenInvoice', {
        amount: formatCurrency(openInvoiceTotal / 100, currency, locale),
        type: productType,
      })
    : t('subscription.changePaymentMethodAuthorization', {
        amount: formatCurrency(AUTHORIZATION_AMOUNT / 100, currency, locale),
      });

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

          {paymentMethod?.name && (
            <SubscriptionListItemMetaItem>
              <MdCreditCard />
              {t('subscription.paymentMethod', {
                paymentMethod: paymentMethod.name,
              })}
            </SubscriptionListItemMetaItem>
          )}

          <SubscriptionListItemMetaItem>
            <MdHistory />{' '}
            <Link href={url}>{t('subscription.detailsAndPayments')}</Link>
          </SubscriptionListItemMetaItem>
        </SubscriptionListItemMeta>

        {pendingPaymentMethodChange && (
          <SubscriptionListItemPaymentMethodChange>
            <Alert severity="info">
              {t('subscription.paymentMethodChangePending', {
                paymentMethod: pendingPaymentMethodChange.paymentMethod.name,
                kind: pendingPaymentMethodChange.kind,
                expiresAt: date.format(
                  new Date(pendingPaymentMethodChange.expiresAt)
                ),
              })}
            </Alert>

            <SubscriptionListItemActions>
              {cancelPaymentMethodChange && (
                <Button
                  onClick={callAction(() =>
                    cancelPaymentMethodChange(pendingPaymentMethodChange.id)
                  )}
                  disabled={loading}
                  variant="text"
                  color="secondary"
                >
                  {t('subscription.paymentMethodChangeCancel')}
                </Button>
              )}

              {changePaymentMethod && (
                <Button
                  onClick={callAction(() =>
                    changePaymentMethod(
                      pendingPaymentMethodChange.paymentMethod.id
                    )
                  )}
                  disabled={loading}
                >
                  {t('subscription.paymentMethodChangeContinue')}
                </Button>
              )}
            </SubscriptionListItemActions>
          </SubscriptionListItemPaymentMethodChange>
        )}

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

            {canRenewCurrentPaymentMethod && (
              <Button
                onClick={() => setConfirmRenewPaymentMethod(true)}
                disabled={loading}
                variant="text"
                title={t('subscription.renewPaymentMethodHint')}
              >
                {t('subscription.renewPaymentMethod')}
              </Button>
            )}

            {canChangePaymentMethod && (
              <Button
                onClick={() => setConfirmChangePaymentMethod(true)}
                disabled={loading}
                variant="text"
              >
                {t('subscription.changePaymentMethod')}
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
        title={t('subscription.cancelProduct', {
          productName: productType,
        })}
      >
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
        title={t('subscription.revertUpgradeTitle')}
      >
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
        title={t('subscription.reactivateProduct', {
          productName: productType,
        })}
      >
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
          await callAction(extend)();
        }}
        submitText={t('subscription.extendBy', {
          subscriptionDuration,
        })}
        cancelText={t('user.cancel')}
        title={t('subscription.extendEarly', {
          type: productType,
        })}
      >
        <Paragraph gutterBottom={!!paymentMethod?.name}>
          {t('subscription.extendEarlyConfirmation', {
            subscriptionDuration,
          })}
        </Paragraph>

        {paymentMethod?.name && (
          <Paragraph gutterBottom={false}>
            {t('subscription.extendChargedWith', {
              paymentMethod: paymentMethod.name,
            })}{' '}
            {canChangePaymentMethod && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setConfirmExtend(false);
                  setConfirmChangePaymentMethod(true);
                }}
              >
                {t('subscription.changePaymentMethod')}
              </Button>
            )}
          </Paragraph>
        )}
      </Modal>

      <Modal
        open={confirmChangePaymentMethod}
        onCancel={() => setConfirmChangePaymentMethod(false)}
        onSubmit={async () => {
          const paymentMethodId =
            chosenPaymentMethodId ?? changeablePaymentMethods[0]?.id;
          setConfirmChangePaymentMethod(false);

          if (paymentMethodId && changePaymentMethod) {
            await callAction(changePaymentMethod)(paymentMethodId);
          }
        }}
        submitText={t('subscription.changePaymentMethodSubmit')}
        cancelText={t('user.cancel')}
        title={t('subscription.changePaymentMethodTitle')}
      >
        <PaymentMethodPicker
          paymentMethods={changeablePaymentMethods}
          value={chosenPaymentMethodId}
          onChange={setChosenPaymentMethodId}
        />

        <Paragraph gutterBottom={false}>
          {paymentMethodChangeExplanation}
        </Paragraph>
      </Modal>

      <Modal
        open={confirmRenewPaymentMethod}
        onCancel={() => setConfirmRenewPaymentMethod(false)}
        onSubmit={async () => {
          setConfirmRenewPaymentMethod(false);

          if (paymentMethod && changePaymentMethod) {
            await callAction(changePaymentMethod)(paymentMethod.id);
          }
        }}
        submitText={t('subscription.changePaymentMethodSubmit')}
        cancelText={t('user.cancel')}
        title={t('subscription.renewPaymentMethodTitle')}
      >
        <Paragraph>
          {t('subscription.renewPaymentMethodConfirmation', {
            paymentMethod: paymentMethod?.name,
          })}
        </Paragraph>

        <Paragraph gutterBottom={false}>
          {paymentMethodChangeExplanation}
        </Paragraph>
      </Modal>
    </SubscriptionListItemWrapper>
  );
}
