import styled from '@emotion/styled';
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Radio,
  Typography,
} from '@mui/material';
import {
  InvoiceListContainer,
  useHasUnpaidInvoices,
} from '@wepublish/membership/website';
import {
  FullInvoiceFragment,
  PaymentPeriodicity,
  ProductType,
  useCancelSubscriptionMutation,
  useInvoicesQuery,
  useSubscriptionsQuery,
} from '@wepublish/website/api';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { useUpdateUserSubscriptionMutation } from '../lib/update-user-subscription';
import { eenewsColors } from '../theme';

const PageWrap = styled('div')`
  padding: 48px 0 96px;
  @media (max-width: 720px) {
    padding: 24px 0 64px;
  }
`;

const Crumb = styled(Link)`
  display: inline-block;
  margin-bottom: 28px;
  color: ${eenewsColors.inkSoft};
  text-decoration: none;
  font-family: inherit;
  font-size: 13px;
  letter-spacing: 0.04em;

  &:hover {
    color: ${eenewsColors.ink};
  }
`;

const EyebrowRow = styled('div')`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const Eyebrow = styled('span')`
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${eenewsColors.inkSoft};
`;

type StatusVariant = 'active' | 'due' | 'cancelled';

const StatusPill = styled('span')<{ variant: StatusVariant }>`
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

const Lede = styled('p')`
  max-width: 64ch;
  margin: 0 0 32px;
  color: ${eenewsColors.inkSoft};
`;

const DetailGrid = styled('div')`
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 32px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
`;

const Aside = styled('aside')`
  display: flex;
  flex-direction: column;
`;

const Card = styled('section')<{ alert?: boolean }>`
  margin-bottom: ${({ alert }) => (alert ? '32px' : '24px')};
  border: 1px solid
    ${({ alert }) => (alert ? eenewsColors.alert : eenewsColors.rule)};
  background: ${({ alert }) =>
    alert ? eenewsColors.alertSoft : eenewsColors.paper};
`;

const CardHead = styled('div')<{ alert?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 22px 28px;
  border-bottom: 1px solid
    ${({ alert }) => (alert ? eenewsColors.alert : eenewsColors.rule)};
  @media (max-width: 720px) {
    padding: 18px 20px;
  }
`;

const CardBody = styled('div')<{ tight?: boolean }>`
  padding: ${({ tight }) => (tight ? '0' : '22px 28px')};
  @media (max-width: 720px) {
    padding: ${({ tight }) => (tight ? '0' : '20px')};
  }
`;

const MetaBlock = styled('div')`
  padding: 12px 0;
  border-bottom: 1px solid ${eenewsColors.rule};

  &:last-of-type {
    border-bottom: none;
  }
`;

const MetaLabel = styled('span')`
  display: block;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${eenewsColors.inkSoft};
  margin-bottom: 4px;
`;

const MetaValue = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 500;
  font-size: 15px;
  color: ${eenewsColors.ink};
`;

const Dot = styled('span')<{ enabled?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ enabled }) =>
    enabled ? eenewsColors.accentDeep : eenewsColors.ruleStrong};
`;

const Actions = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GhostButton = styled('button')`
  appearance: none;
  background: ${eenewsColors.paper};
  color: ${eenewsColors.ink};
  border: 1px solid ${eenewsColors.ruleStrong};
  padding: 12px 18px;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  transition:
    background 0.12s ease,
    color 0.12s ease;

  &:hover:not(:disabled) {
    background: ${eenewsColors.ink};
    color: ${eenewsColors.paper};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelLink = styled('button')`
  appearance: none;
  background: none;
  border: none;
  margin-top: 16px;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  color: ${eenewsColors.alertDeep};
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
`;

const periodSuffix = (periodicity: string) => {
  switch (periodicity.toLowerCase()) {
    case 'monthly':
      return 'Monat';
    case 'quarterly':
      return 'Quartal';
    case 'biannual':
      return 'Halbjahr';
    case 'yearly':
      return 'Jahr';
    case 'biennial':
      return '2 Jahre';
    case 'lifetime':
      return 'Lebenslang';
    default:
      return '';
  }
};

const periodWord = (periodicity: string) => {
  switch (periodicity.toLowerCase()) {
    case 'monthly':
      return 'Monatliche';
    case 'quarterly':
      return 'Vierteljährliche';
    case 'biannual':
      return 'Halbjährliche';
    case 'yearly':
      return 'Jährliche';
    case 'biennial':
      return 'Zweijährliche';
    case 'lifetime':
      return 'Lebenslange';
    default:
      return '';
  }
};

const formatGermanDate = (iso: string, withDay = false) =>
  new Date(iso).toLocaleDateString(
    'de-CH',
    withDay ?
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'long', year: 'numeric' }
  );

const formatYearsMonths = (start: Date, now: Date) => {
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (months < 1) {
    return 'weniger als 1 Monat';
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const yLabel = years > 0 ? `${years} ${years === 1 ? 'Jahr' : 'Jahre'}` : '';
  const mLabel =
    remMonths > 0 ? `${remMonths} ${remMonths === 1 ? 'Monat' : 'Monate'}` : '';
  return [yLabel, mLabel].filter(Boolean).join(', ');
};

const isUnpaid = (inv: FullInvoiceFragment) =>
  !!inv.subscription && !inv.canceledAt && !inv.paidAt;

export function EenewsSubscriptionDetail() {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const { data: subData } = useSubscriptionsQuery();
  const { data: invData } = useInvoicesQuery();
  const hasUnpaidInvoices = useHasUnpaidInvoices();

  const [cancelSubscription, { loading: cancelLoading }] =
    useCancelSubscriptionMutation();
  const [cancelError, setCancelError] = useState<Error | null>(null);
  const [updateUserSubscription, { loading: updateLoading }] =
    useUpdateUserSubscriptionMutation();
  const [actionError, setActionError] = useState<Error | null>(null);
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [draftPaymentMethodId, setDraftPaymentMethodId] = useState<
    string | null
  >(null);

  const subscription = (subData?.userSubscriptions ?? []).find(
    s => s.id === id
  );

  const subscriptionInvoices = (invData?.userInvoices ?? []).filter(
    inv => inv.subscriptionID === id
  );
  const unpaidInvoices = subscriptionInvoices.filter(isUnpaid);
  const totalPaidCents = subscriptionInvoices
    .filter(inv => inv.paidAt)
    .reduce((sum, inv) => sum + inv.total, 0);

  if (!subscription) {
    return (
      <Container>
        <PageWrap>
          <Crumb href="/profile">← Mein Konto</Crumb>
          <Typography
            variant="bodyTeaserStandard"
            component="p"
          >
            Mitgliedschaft nicht gefunden.
          </Typography>
        </PageWrap>
      </Container>
    );
  }

  const isCancelled = !!subscription.deactivation;
  const subStatus: StatusVariant =
    isCancelled ? 'cancelled'
    : hasUnpaidInvoices && unpaidInvoices.length > 0 ? 'due'
    : 'active';
  const statusLabel =
    subStatus === 'active' ? 'Aktiv'
    : subStatus === 'due' ? 'Zahlung offen'
    : 'Gekündigt';

  const periodLabel = periodSuffix(subscription.paymentPeriodicity);
  const periodAdjective = periodWord(subscription.paymentPeriodicity);
  const isMonthly =
    subscription.paymentPeriodicity === PaymentPeriodicity.Monthly;
  const monthFactor = (() => {
    switch (subscription.paymentPeriodicity) {
      case PaymentPeriodicity.Monthly:
        return 1;
      case PaymentPeriodicity.Quarterly:
        return 3;
      case PaymentPeriodicity.Biannual:
        return 6;
      case PaymentPeriodicity.Yearly:
        return 12;
      case PaymentPeriodicity.Biennial:
        return 24;
      default:
        return 1;
    }
  })();
  const periodTotalCents = subscription.monthlyAmount * monthFactor;

  const currency = subscription.memberPlan.currency;
  const formatter = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  const startsAt = new Date(subscription.startsAt);
  const memberSinceLabel = `${formatGermanDate(
    subscription.startsAt
  )} · ${formatYearsMonths(startsAt, new Date())}`;

  const idShort = `${startsAt.getFullYear()}-${subscription.id
    .slice(-4)
    .toUpperCase()}`;
  const productLabel =
    subscription.memberPlan.productType === ProductType.Donation ?
      'Spende'
    : 'Mitgliedschaft';
  const ledeIntro =
    isCancelled ?
      `Diese ${productLabel.toLowerCase()} ist gekündigt`
    : `${periodAdjective} ${productLabel.toLowerCase()} seit ${formatGermanDate(
        subscription.startsAt
      )}`;
  const ledeAmount =
    isMonthly ?
      `${formatter.format(subscription.monthlyAmount / 100)} pro Monat`
    : `${formatter.format(periodTotalCents / 100)} pro ${periodLabel}`;

  const handleCancel = async () => {
    if (!subscription) {
      return;
    }
    if (
      !window.confirm(
        `${productLabel} "${subscription.memberPlan.name}" wirklich kündigen?`
      )
    ) {
      return;
    }
    setCancelError(null);
    try {
      await cancelSubscription({
        variables: { subscriptionId: subscription.id },
      });
    } catch (err) {
      setCancelError(err as Error);
    }
  };

  // Common payload for updateUserSubscription — keeps every required input
  // field at its current value and toggles only what the caller cares about.
  const baseUpdateInput =
    subscription ?
      {
        id: subscription.id,
        autoRenew: subscription.autoRenew,
        monthlyAmount: subscription.monthlyAmount,
        paymentMethodID: subscription.paymentMethod.id,
        paymentPeriodicity: subscription.paymentPeriodicity,
        memberPlanID: subscription.memberPlan.id,
      }
    : null;

  const handleAutoRenewToggle = async () => {
    if (!subscription || !baseUpdateInput) {
      return;
    }
    const next = !subscription.autoRenew;
    const verb =
      next ?
        'Auto-Verlängerung aktivieren?'
      : 'Auto-Verlängerung pausieren? Deine Mitgliedschaft endet dann am Ende der bezahlten Periode.';
    if (!window.confirm(verb)) {
      return;
    }
    setActionError(null);
    try {
      await updateUserSubscription({
        variables: {
          id: subscription.id,
          input: { ...baseUpdateInput, autoRenew: next },
        },
      });
    } catch (err) {
      setActionError(err as Error);
    }
  };

  // Available payment-method options on this subscription's plan.
  const availablePaymentMethods = (
    subscription?.memberPlan.availablePaymentMethods ?? []
  )
    .flatMap(group => group.paymentMethods)
    .filter(
      (method, index, all) => all.findIndex(m => m.id === method.id) === index
    );

  const openPaymentMethodDialog = () => {
    setDraftPaymentMethodId(subscription?.paymentMethod.id ?? null);
    setPaymentMethodDialogOpen(true);
  };

  const handlePaymentMethodSubmit = async () => {
    if (!subscription || !baseUpdateInput || !draftPaymentMethodId) {
      return;
    }
    if (draftPaymentMethodId === subscription.paymentMethod.id) {
      setPaymentMethodDialogOpen(false);
      return;
    }
    setActionError(null);
    try {
      await updateUserSubscription({
        variables: {
          id: subscription.id,
          input: {
            ...baseUpdateInput,
            paymentMethodID: draftPaymentMethodId,
          },
        },
      });
      setPaymentMethodDialogOpen(false);
    } catch (err) {
      setActionError(err as Error);
    }
  };

  return (
    <Container>
      <PageWrap>
        <Crumb href="/profile">← Mein Konto</Crumb>

        <EyebrowRow>
          <Eyebrow>
            {productLabel} · ID {idShort}
          </Eyebrow>
          <StatusPill variant={subStatus}>
            <Dot enabled={subStatus === 'active'} />
            {statusLabel}
          </StatusPill>
        </EyebrowRow>

        <Typography
          variant="displayProfileH1"
          component="h1"
          sx={{ margin: '0 0 12px', color: eenewsColors.ink }}
        >
          {productLabel}
          <Typography
            component="em"
            sx={{
              fontStyle: 'italic',
              fontWeight: 300,
              color: eenewsColors.inkSoft,
              display: 'block',
            }}
          >
            {subscription.memberPlan.name}
            <Typography
              component="em"
              sx={{
                fontStyle: 'italic',
                fontWeight: 300,
                color: eenewsColors.inkSoft,
              }}
            >
              .
            </Typography>
          </Typography>
        </Typography>
        <Lede>
          <Typography
            variant="bodyLeadXl"
            component="span"
            sx={{ fontWeight: 300 }}
          >
            {ledeIntro}. Du unterstützt unabhängigen Journalismus zur
            Energiewende mit {ledeAmount}
            {isCancelled ? '' : ' — danke'}.
          </Typography>
        </Lede>

        <DetailGrid>
          <Aside>
            <Card>
              <CardHead>
                <Typography
                  variant="displayTeaserMd"
                  component="h2"
                  sx={{ margin: 0, color: eenewsColors.ink }}
                >
                  Details
                </Typography>
              </CardHead>
              <CardBody>
                <MetaBlock>
                  <MetaLabel>Plan</MetaLabel>
                  <MetaValue>{subscription.memberPlan.name}</MetaValue>
                </MetaBlock>
                <MetaBlock>
                  <MetaLabel>Betrag</MetaLabel>
                  <MetaValue>
                    {formatter.format(subscription.monthlyAmount / 100)}
                    {' / Monat'}
                    {!isMonthly ?
                      ` (${formatter.format(periodTotalCents / 100)} / ${periodLabel})`
                    : ''}
                  </MetaValue>
                </MetaBlock>
                <MetaBlock>
                  <MetaLabel>Zahlart</MetaLabel>
                  <MetaValue>{subscription.paymentMethod.name}</MetaValue>
                </MetaBlock>
                <MetaBlock>
                  <MetaLabel>Auto-Verlängerung</MetaLabel>
                  <MetaValue>
                    <Dot enabled={subscription.autoRenew} />
                    {subscription.autoRenew ? 'Aktiv' : 'Inaktiv'}
                  </MetaValue>
                </MetaBlock>
                {subscription.paidUntil ?
                  <MetaBlock>
                    <MetaLabel>Nächste Zahlung</MetaLabel>
                    <MetaValue>
                      {formatGermanDate(subscription.paidUntil)}
                    </MetaValue>
                  </MetaBlock>
                : null}
                <MetaBlock>
                  <MetaLabel>Mitglied seit</MetaLabel>
                  <MetaValue>{memberSinceLabel}</MetaValue>
                </MetaBlock>
              </CardBody>
            </Card>

            {!isCancelled ?
              <Actions>
                <GhostButton
                  onClick={() =>
                    router.push(
                      `/profile/subscription/${subscription.id}/upgrade`
                    )
                  }
                >
                  Plan ändern
                </GhostButton>
                <GhostButton
                  onClick={openPaymentMethodDialog}
                  disabled={
                    updateLoading || availablePaymentMethods.length === 0
                  }
                >
                  Zahlart aktualisieren
                </GhostButton>
                <GhostButton
                  onClick={handleAutoRenewToggle}
                  disabled={updateLoading}
                >
                  {subscription.autoRenew ?
                    'Auto-Verlängerung pausieren'
                  : 'Auto-Verlängerung aktivieren'}
                </GhostButton>
                <CancelLink
                  onClick={handleCancel}
                  disabled={cancelLoading}
                >
                  {productLabel} kündigen
                </CancelLink>
              </Actions>
            : null}

            {cancelError ?
              <Typography
                variant="metaInline"
                component="p"
                sx={{ color: eenewsColors.alertDeep, marginTop: 1 }}
              >
                {cancelError.message}
              </Typography>
            : null}
            {actionError ?
              <Typography
                variant="metaInline"
                component="p"
                sx={{ color: eenewsColors.alertDeep, marginTop: 1 }}
              >
                {actionError.message}
              </Typography>
            : null}
          </Aside>

          <div>
            {unpaidInvoices.length > 0 ?
              <Card alert>
                <CardHead alert>
                  <Typography
                    variant="displayTeaserMd"
                    component="h2"
                    sx={{ margin: 0, color: eenewsColors.alertDeep }}
                  >
                    ⚠ Offene Rechnung
                    {unpaidInvoices.length > 1 ?
                      ` · ${unpaidInvoices.length} ausstehend`
                    : ''}
                  </Typography>
                  {unpaidInvoices[0]?.dueAt ?
                    <Typography
                      variant="metaInline"
                      component="span"
                      sx={{ color: eenewsColors.alertDeep }}
                    >
                      Fällig {formatGermanDate(unpaidInvoices[0].dueAt)}
                    </Typography>
                  : null}
                </CardHead>
                <CardBody tight>
                  <InvoiceListContainer
                    filter={invoices =>
                      invoices.filter(
                        inv => inv.subscriptionID === id && isUnpaid(inv)
                      )
                    }
                  />
                </CardBody>
              </Card>
            : null}

            <Card>
              <CardHead>
                <Typography
                  variant="displayTeaserMd"
                  component="h2"
                  sx={{ margin: 0, color: eenewsColors.ink }}
                >
                  Rechnungsverlauf
                </Typography>
                <Typography
                  variant="metaInline"
                  component="span"
                  sx={{ color: eenewsColors.inkSoft }}
                >
                  {subscriptionInvoices.length}{' '}
                  {subscriptionInvoices.length === 1 ?
                    'Rechnung'
                  : 'Rechnungen'}
                  {totalPaidCents > 0 ?
                    ` · ${formatter.format(totalPaidCents / 100)} bezahlt`
                  : ''}
                </Typography>
              </CardHead>
              <CardBody tight>
                <InvoiceListContainer
                  filter={invoices =>
                    invoices.filter(inv => inv.subscriptionID === id)
                  }
                />
              </CardBody>
            </Card>
          </div>
        </DetailGrid>
      </PageWrap>

      <Dialog
        open={paymentMethodDialogOpen}
        onClose={() => setPaymentMethodDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Zahlart aktualisieren</DialogTitle>
        <DialogContent>
          <Typography
            variant="bodyTeaserStandard"
            component="p"
            sx={{ marginBottom: 2, color: eenewsColors.inkSoft }}
          >
            Wähle eine andere Zahlart für diese Mitgliedschaft. Die nächste
            Rechnung wird darüber abgebucht.
          </Typography>
          {availablePaymentMethods.length === 0 ?
            <Typography
              variant="bodyTeaserStandard"
              component="p"
              sx={{ color: eenewsColors.inkSoft }}
            >
              Keine alternativen Zahlarten verfügbar.
            </Typography>
          : availablePaymentMethods.map(method => (
              <label
                key={method.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: `1px solid ${eenewsColors.rule}`,
                  cursor: 'pointer',
                }}
              >
                <Radio
                  name="payment-method"
                  value={method.id}
                  checked={draftPaymentMethodId === method.id}
                  onChange={() => setDraftPaymentMethodId(method.id)}
                />
                <span>
                  <Typography
                    variant="bodyTeaserStandard"
                    component="span"
                    sx={{ fontWeight: 500, display: 'block' }}
                  >
                    {method.name}
                  </Typography>
                  {method.description ?
                    <Typography
                      variant="metaInline"
                      component="span"
                      sx={{ color: eenewsColors.inkSoft }}
                    >
                      {method.description}
                    </Typography>
                  : null}
                </span>
              </label>
            ))
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentMethodDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handlePaymentMethodSubmit}
            disabled={updateLoading || !draftPaymentMethodId}
            variant="contained"
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
