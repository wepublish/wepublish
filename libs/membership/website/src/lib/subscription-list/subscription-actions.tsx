import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import {
  FullPaymentMethodFragment,
  FullSubscriptionFragment,
} from '@wepublish/website/api';
import {
  BuilderSubscriptionListItemProps,
  Modal,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { PropsWithChildren, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { MdInfoOutline } from 'react-icons/md';
import { formatCurrency } from '../formatters/format-currency';
import { PaymentMethodChoice } from './payment-method-choice';

export const SubscriptionListItemActions = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};

  @container (min-width: 35ch) {
    display: flex;
    justify-content: space-between;
  }
`;

/** In the extension dialog: how it is paid, and the way to change that. */
export const SubscriptionExtendPaymentMethod = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1, 3)};

  & > p {
    margin: 0;
  }
`;

export const SubscriptionListItemPaymentMethodChange = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
`;

/**
 * A pending payment method change in the table: one line, outlined, in line
 * with the other actions; where to and until when on its icon.
 */
export const SubscriptionPendingChange = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1, 2)};
  // the alert's blue: its light background would barely show as a line
  border: 1px solid ${({ theme }) => theme.palette.info.main};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: transparent;
  padding: ${({ theme }) => theme.spacing(0.5, 1, 0.5, 1.5)};
`;

export const SubscriptionPendingChangeLabel = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-right: auto;
`;

export const SubscriptionPendingChangeInfo = styled('span')`
  display: inline-flex;
  color: ${({ theme }) => theme.palette.info.main};
  font-size: 1.375em;
  cursor: help;
  border-radius: 50%;

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;

/** Held by some payment providers to authorize a payment method, in cents. */
const AUTHORIZATION_AMOUNT = 1;

/**
 * The payment methods of the member plan a subscription can move to: those
 * offered for its billing period (and auto-renewal), without its current one.
 */
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
          id !== paymentMethod?.id &&
          // managed by the payment provider, cannot be switched to
          slug !== 'payrexx-subscription'
      );

    return options.filter(
      (option, index) =>
        options.findIndex(({ id }) => id === option.id) === index
    );
  }, [memberPlan, paymentMethod, paymentPeriodicity, autoRenew]);

/**
 * Whether a subscription's payment method can be changed to another one, or
 * renewed (e.g. a new card or TWINT account for the same payment method).
 */
export const usePaymentMethodActions = ({
  paymentMethod,
  memberPlan,
  paymentPeriodicity,
  autoRenew,
  deactivation,
  pendingPaymentMethodChange,
  canRenewPaymentMethod,
  changePaymentMethod,
}: Pick<
  BuilderSubscriptionListItemProps,
  | 'paymentMethod'
  | 'memberPlan'
  | 'paymentPeriodicity'
  | 'autoRenew'
  | 'deactivation'
  | 'pendingPaymentMethodChange'
  | 'canRenewPaymentMethod'
  | 'changePaymentMethod'
>) => {
  const changeablePaymentMethods = useChangeablePaymentMethods({
    paymentMethod,
    memberPlan,
    paymentPeriodicity,
    autoRenew,
  });
  const changeable =
    !!changePaymentMethod && !deactivation && !pendingPaymentMethodChange;

  return {
    changeablePaymentMethods,
    canChangePaymentMethod: changeable && changeablePaymentMethods.length > 0,
    canRenewCurrentPaymentMethod:
      changeable && !!canRenewPaymentMethod && !!paymentMethod,
  };
};

export type SubscriptionActionsProps = PropsWithChildren<
  Pick<
    BuilderSubscriptionListItemProps,
    | 'autoRenew'
    | 'paidUntil'
    | 'paymentPeriodicity'
    | 'deactivation'
    | 'memberPlan'
    | 'paymentMethod'
    | 'pendingPaymentMethodChange'
    | 'canRenewPaymentMethod'
    | 'extendable'
    | 'cancel'
    | 'reactivate'
    | 'revertUpgrade'
    | 'canRevertUpgrade'
    | 'canExtend'
    | 'extend'
    | 'changePaymentMethod'
    | 'cancelPaymentMethodChange'
    | 'openInvoiceTotal'
  > & {
    /**
     * `table`: cancelling and the payment method as buttons, not text links,
     * and the payment methods to change to by name (subscription history and
     * edit page).
     */
    variant?: 'card' | 'table';
    /** Which actions to offer; all of them by default. */
    actions?: readonly SubscriptionAction[];
    /** How to name a payment method; its name from the editor by default. */
    paymentMethodLabel?: (paymentMethod: FullPaymentMethodFragment) => string;
  }
>;

export type SubscriptionAction =
  | 'pendingChange'
  | 'renewPaymentMethod'
  | 'changePaymentMethod'
  | 'cancel'
  | 'reactivate'
  | 'revertUpgrade'
  | 'extend';

const ALL_ACTIONS: readonly SubscriptionAction[] = [
  'pendingChange',
  'renewPaymentMethod',
  'changePaymentMethod',
  'cancel',
  'reactivate',
  'revertUpgrade',
  'extend',
];

/**
 * What needs to be at hand right away; cancelling and the payment method live
 * on the subscription's own page.
 */
export const IMMEDIATE_ACTIONS: readonly SubscriptionAction[] = [
  'pendingChange',
  'reactivate',
  'revertUpgrade',
  'extend',
];

/**
 * What a reader can do with one subscription: the pending payment method
 * change, cancel, reactivate, revert an upgrade, renew or change the payment
 * method, extend early, and the confirmation dialogs for each. Shared by the
 * subscription card and the subscription history table; `children` is shown
 * between the pending change and the actions.
 */
export function SubscriptionActions({
  autoRenew,
  paidUntil,
  paymentPeriodicity,
  deactivation,
  memberPlan,
  paymentMethod,
  pendingPaymentMethodChange,
  canRenewPaymentMethod,
  extendable,
  cancel,
  reactivate,
  revertUpgrade,
  canRevertUpgrade,
  canExtend,
  extend,
  changePaymentMethod,
  cancelPaymentMethodChange,
  openInvoiceTotal,
  children,
  variant = 'card',
  actions = ALL_ACTIONS,
  paymentMethodLabel = ({ name }) => name,
}: SubscriptionActionsProps) {
  const show = (action: SubscriptionAction) => actions.includes(action);

  const { currency, productType } = memberPlan;
  const {
    meta: { locale },
    elements: { Button, Alert, Paragraph },
    PaymentMethodPicker,
    date,
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);

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

  const {
    changeablePaymentMethods,
    canChangePaymentMethod,
    canRenewCurrentPaymentMethod,
  } = usePaymentMethodActions({
    paymentMethod,
    memberPlan,
    paymentPeriodicity,
    autoRenew,
    deactivation,
    pendingPaymentMethodChange,
    canRenewPaymentMethod,
    changePaymentMethod,
  });
  const [chosenPaymentMethodId, setChosenPaymentMethodId] = useState<string>();

  const paymentMethodChangeExplanation =
    openInvoiceTotal ?
      t('subscription.changePaymentMethodOpenInvoice', {
        amount: formatCurrency(openInvoiceTotal / 100, currency, locale),
        type: productType,
      })
    : t('subscription.changePaymentMethodAuthorization', {
        amount: formatCurrency(AUTHORIZATION_AMOUNT / 100, currency, locale),
      });

  const pendingChangeDetails =
    pendingPaymentMethodChange &&
    t('subscription.paymentMethodChangePending', {
      paymentMethod: paymentMethodLabel(
        pendingPaymentMethodChange.paymentMethod
      ),
      kind: pendingPaymentMethodChange.kind,
      expiresAt: date.format(new Date(pendingPaymentMethodChange.expiresAt)),
    });

  const pendingChangeButtons = pendingPaymentMethodChange && (
    <>
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
            changePaymentMethod(pendingPaymentMethodChange.paymentMethod.id)
          )}
          disabled={loading}
        >
          {t('subscription.paymentMethodChangeContinue')}
        </Button>
      )}
    </>
  );

  return (
    <>
      {show('pendingChange') &&
        pendingPaymentMethodChange &&
        (variant === 'table' ?
          <SubscriptionPendingChange data-pending-change>
            <SubscriptionPendingChangeLabel>
              {/* on tapping too: touch has no hover */}
              <Tooltip
                title={pendingChangeDetails}
                placement="top"
                enterTouchDelay={0}
                leaveTouchDelay={6000}
              >
                <SubscriptionPendingChangeInfo tabIndex={0}>
                  <MdInfoOutline />
                </SubscriptionPendingChangeInfo>
              </Tooltip>
              {t('subscription.paymentMethodChangePendingShort')}
            </SubscriptionPendingChangeLabel>

            {pendingChangeButtons}
          </SubscriptionPendingChange>
        : <SubscriptionListItemPaymentMethodChange>
            <Alert severity="info">{pendingChangeDetails}</Alert>

            <SubscriptionListItemActions>
              {pendingChangeButtons}
            </SubscriptionListItemActions>
          </SubscriptionListItemPaymentMethodChange>)}

      {children}

      {error && <Alert severity="error">{error.message}</Alert>}

      {show('revertUpgrade') && canRevertUpgrade && revertUpgrade && (
        <SubscriptionListItemActions>
          <Button
            onClick={() => setConfirmRevertUpgrade(true)}
            disabled={loading}
          >
            {t('subscription.revertUpgrade')}
          </Button>
        </SubscriptionListItemActions>
      )}

      {show('reactivate') &&
        deactivation &&
        !canRevertUpgrade &&
        reactivate && (
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
          {show('cancel') && (extendable || !paidUntil) && (
            <Button
              onClick={() => setConfirmCancel(true)}
              disabled={loading}
              // the theme paints secondary outlined buttons white, for dark
              // backgrounds
              {...(variant === 'table' ?
                { variant: 'outlined', color: 'primary' }
              : { variant: 'text', color: 'secondary' })}
            >
              {t('subscription.cancel', {
                type: productType,
              })}
            </Button>
          )}

          {show('renewPaymentMethod') && canRenewCurrentPaymentMethod && (
            <Button
              onClick={() => setConfirmRenewPaymentMethod(true)}
              disabled={loading}
              variant={variant === 'table' ? 'outlined' : 'text'}
              title={t('subscription.renewPaymentMethodHint')}
            >
              {t('subscription.renewPaymentMethod')}
            </Button>
          )}

          {show('changePaymentMethod') && canChangePaymentMethod && (
            <Button
              onClick={() => setConfirmChangePaymentMethod(true)}
              disabled={loading}
              variant={variant === 'table' ? 'contained' : 'text'}
            >
              {t('subscription.changePaymentMethod')}
            </Button>
          )}

          {show('extend') && canExtend && (
            <Button
              onClick={() => setConfirmExtend(true)}
              disabled={loading}
            >
              {t('subscription.extendNow')}
            </Button>
          )}
        </SubscriptionListItemActions>
      )}

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
            type: productType,
          })}
        </Paragraph>

        {paymentMethod && (
          <SubscriptionExtendPaymentMethod>
            <Paragraph gutterBottom={false}>
              <Trans
                i18nKey="subscription.extendChargedWith"
                values={{ paymentMethod: paymentMethodLabel(paymentMethod) }}
                components={{ strong: <strong /> }}
              />
            </Paragraph>

            {canChangePaymentMethod && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => {
                  setConfirmExtend(false);
                  setConfirmChangePaymentMethod(true);
                }}
              >
                {t('subscription.changePaymentMethod')}
              </Button>
            )}
          </SubscriptionExtendPaymentMethod>
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
        {variant === 'table' ?
          <PaymentMethodChoice
            current={paymentMethod}
            paymentMethods={changeablePaymentMethods}
            value={chosenPaymentMethodId}
            onChange={setChosenPaymentMethodId}
            label={paymentMethodLabel}
          />
        : <PaymentMethodPicker
            paymentMethods={changeablePaymentMethods}
            value={chosenPaymentMethodId}
            onChange={setChosenPaymentMethodId}
          />
        }

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
            paymentMethod: paymentMethod && paymentMethodLabel(paymentMethod),
          })}
        </Paragraph>

        <Paragraph gutterBottom={false}>
          {paymentMethodChangeExplanation}
        </Paragraph>
      </Modal>
    </>
  );
}
