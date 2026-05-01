import styled from '@emotion/styled';
import { Box, Container, Typography } from '@mui/material';
import { useUser } from '@wepublish/authentication/website';
import { usePayInvoice } from '@wepublish/payment/website';
import {
  getSessionTokenProps,
  ssrAuthLink,
  withAuthGuard,
} from '@wepublish/utils/website';
import {
  addClientCacheToV1Props,
  AvailablePaymentMethod,
  getV1ApiClient,
  InvoicesDocument,
  MeDocument,
  NavigationListDocument,
  PaymentMethod,
  useChallengeQuery,
  useInvoicesQuery,
  useMemberPlanListQuery,
} from '@wepublish/website/api';
import { NextPageContext } from 'next';
import getConfig from 'next/config';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

import { eenewsColors } from '../src/theme';

const Crumb = styled(Link)`
  display: inline-block;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: ${eenewsColors.inkSoft};
  text-decoration: none;
  margin: 24px 0;
`;

const Hero = styled('section')`
  background: ${eenewsColors.ink};
  color: ${eenewsColors.paper};
  padding: 56px 0 48px;
  margin-bottom: 48px;
  @media (max-width: 720px) {
    padding: 32px 0 28px;
    margin-bottom: 28px;
  }
`;

const HeroInner = styled(Container)`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 56px;
  align-items: center;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

// We use plain `Box` divs and inline `<Typography variant=... component=...>`
// rather than `styled(Typography)` because the styled() wrapper drops MUI's
// OverridableComponent typing, breaking the `component` prop. See cross-project
// pattern note in `wepublish-redesign-patterns.md` "Anti-pattern N — styled(Typography)
// loses component generic". Use `sx` for layout + `Typography variant` for tokens.
const HeroEyebrowWrap = styled('div')`
  margin-bottom: 12px;
`;
const HeroH1Wrap = styled('div')`
  margin: 0 0 12px;
  max-width: 18ch;
`;
const HeroLeadWrap = styled('div')`
  max-width: 56ch;
`;

const RetryCta = styled('a')`
  display: inline-flex;
  justify-content: center;
  padding: 14px 22px;
  background: ${eenewsColors.highlight};
  color: ${eenewsColors.ink};
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
`;

const Layout = styled(Container)`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 56px;
  align-items: start;
  padding-bottom: 80px;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  @media (max-width: 720px) {
    padding-bottom: 56px;
  }
`;

const Card = styled('section')`
  border: 1px solid ${eenewsColors.rule};
  background: ${eenewsColors.paper};
  margin-bottom: 32px;
`;

const CardHead = styled('div')`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 18px 28px;
  border-bottom: 1px solid ${eenewsColors.rule};
  align-items: baseline;
  @media (max-width: 720px) {
    padding: 16px 20px;
  }
`;

const CardBody = styled('div')`
  padding: 24px 28px;
  @media (max-width: 720px) {
    padding: 20px;
  }
`;

const PaymentRow = styled('button')<{ selected: boolean }>`
  display: grid;
  grid-template-columns: 44px 1fr 22px;
  gap: 20px;
  width: 100%;
  padding: 18px 22px;
  margin: 0 0 12px;
  @media (max-width: 720px) {
    padding: 14px 16px;
    gap: 14px;
  }
  border: ${({ selected }) =>
    selected ?
      `2px solid ${eenewsColors.ink}`
    : `1px solid ${eenewsColors.ruleStrong}`};
  background: ${({ selected }) =>
    selected ? eenewsColors.paperWarm : eenewsColors.paper};
  cursor: pointer;
  align-items: center;
  text-align: left;
  font-family: inherit;
  color: ${eenewsColors.ink};
  border-radius: 4px;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
  &:hover {
    border-color: ${eenewsColors.ink};
  }
`;

const PaymentIcon = styled('div')`
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: ${eenewsColors.ink};
  color: ${eenewsColors.paper};
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  letter-spacing: -0.02em;
`;

const Radio = styled('div')<{ selected: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: ${({ selected }) =>
    selected ?
      `2px solid ${eenewsColors.ink}`
    : `1px solid ${eenewsColors.ruleStrong}`};
  display: grid;
  place-items: center;
  &::after {
    content: '';
    display: ${({ selected }) => (selected ? 'block' : 'none')};
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${eenewsColors.ink};
  }
`;

const TimelineStep = styled('div')<{ state: 'done' | 'failed' | 'pending' }>`
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 16px;
  padding: 12px 0;
  align-items: flex-start;
  & .dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid ${eenewsColors.ruleStrong};
    display: grid;
    place-items: center;
    font-size: 11px;
    margin-top: 2px;
    color: ${eenewsColors.inkSoft};
    background: ${({ state }) =>
      state === 'failed' ? '#c1361b'
      : state === 'done' ? eenewsColors.accent
      : eenewsColors.paper};
    border-color: ${({ state }) =>
      state === 'failed' ? '#c1361b'
      : state === 'done' ? eenewsColors.accent
      : eenewsColors.ruleStrong};
  }
  & .lbl {
    color: ${({ state }) =>
      state === 'failed' ? '#a32d17'
      : state === 'pending' ? eenewsColors.inkSoft
      : eenewsColors.ink};
    font-weight: ${({ state }) => (state === 'failed' ? 500 : 400)};
  }
`;

function formatChf(amountCents: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
  }).format(amountCents / 100);
}

function PaymentFailedPage() {
  const { hasUser } = useUser();
  const { query } = useRouter();
  const invoiceIdFromQuery = query.invoice as string | undefined;
  const errorMessage = query.error as string | undefined;
  const { data: invoiceData } = useInvoicesQuery({
    fetchPolicy: 'cache-only',
    skip: !hasUser,
  });
  const { data: planData } = useMemberPlanListQuery({
    variables: { take: 50, filter: { active: true } },
    fetchPolicy: 'cache-only',
  });
  const { data: challengeData } = useChallengeQuery({
    fetchPolicy: 'cache-only',
  });

  // Pick either the explicit invoice from query or the most recent unpaid one.
  // The website fragment exposes `userInvoices`, not `invoices`.
  const invoice = useMemo(() => {
    const list = invoiceData?.userInvoices ?? [];
    if (invoiceIdFromQuery) {
      return list.find(i => i.id === invoiceIdFromQuery);
    }
    return list.find(i => !i.paidAt && !i.canceledAt) ?? list[0];
  }, [invoiceData, invoiceIdFromQuery]);

  const memberPlan = useMemo(() => {
    if (!invoice) {
      return undefined;
    }
    const plans = planData?.memberPlans?.nodes ?? [];
    return plans.find(p =>
      invoice.subscription ? p.id === invoice.subscription.memberPlan.id : false
    );
  }, [invoice, planData]);

  const availablePaymentMethods: PaymentMethod[] = useMemo(() => {
    const out: PaymentMethod[] = [];
    const seen = new Set<string>();
    const list = (memberPlan?.availablePaymentMethods ??
      []) as AvailablePaymentMethod[];
    for (const apm of list) {
      for (const pm of apm.paymentMethods) {
        if (!seen.has(pm.id)) {
          seen.add(pm.id);
          out.push(pm);
        }
      }
    }
    return out;
  }, [memberPlan]);

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | undefined
  >(undefined);
  const [pay, , stripeClientSecret] = usePayInvoice();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!invoice || !selectedPaymentMethodId || !challengeData?.challenge) {
      return;
    }
    setLoading(true);
    try {
      await pay(memberPlan, {
        variables: {
          invoiceId: invoice.id,
          paymentMethodId: selectedPaymentMethodId,
          successURL: window.location.origin + '/payment-success',
          failureURL: window.location.origin + '/payment-failed',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const amount = invoice?.total ?? memberPlan?.amountPerMonthMin ?? 2500;

  return (
    <>
      <Container sx={{ paddingTop: 1 }}>
        <Crumb href="/profile">← Mein Konto</Crumb>
      </Container>

      <Hero>
        <HeroInner>
          <Box>
            <HeroEyebrowWrap>
              <Typography
                variant="metaEyebrow"
                component="div"
                sx={{ color: eenewsColors.highlight }}
              >
                Zahlung fehlgeschlagen{' '}
                {invoice ?
                  `· ${new Date(invoice.dueAt ?? invoice.createdAt).toLocaleDateString('de-CH')}`
                : ''}
              </Typography>
            </HeroEyebrowWrap>
            <HeroH1Wrap>
              <Typography
                variant="displayFeatureH2"
                component="h1"
                sx={{
                  margin: 0,
                  color: eenewsColors.paper,
                  fontSize: 'clamp(36px, 4.4vw, 56px)',
                  lineHeight: 1.05,
                }}
              >
                Wir konnten deine Zahlung nicht abbuchen.
              </Typography>
            </HeroH1Wrap>
            <HeroLeadWrap>
              <Typography
                variant="bodyLead"
                component="p"
                sx={{ margin: 0, color: 'rgba(245, 240, 230, 0.78)' }}
              >
                {errorMessage ?
                  `Fehler: ${errorMessage}.`
                : `Wir haben versucht, ${formatChf(amount)} für ${
                    memberPlan?.name ?? 'deine Mitgliedschaft'
                  } abzubuchen, ohne Erfolg. Möglicherweise ist deine hinterlegte Zahlart nicht mehr aktiv.`
                }
              </Typography>
            </HeroLeadWrap>
          </Box>
          <Box
            display="flex"
            flexDirection="column"
            gap={1}
          >
            <RetryCta href="#zahlart">Zahlart aktualisieren</RetryCta>
            <a
              href="#methoden"
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                textAlign: 'center',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                paddingTop: 8,
              }}
            >
              oder andere Methode wählen
            </a>
          </Box>
        </HeroInner>
      </Hero>

      <Layout>
        <Box>
          {/* Invoice summary */}
          <Card>
            <CardHead>
              <Typography
                variant="displaySection"
                component="h2"
                sx={{ margin: 0, fontSize: 24 }}
              >
                Rechnung {invoice?.id?.slice(-7) ?? '—'}
              </Typography>
              <Typography
                variant="metaInline"
                component="span"
                sx={{ color: eenewsColors.inkSoft }}
              >
                {invoice?.dueAt ?
                  new Date(invoice.dueAt).toLocaleDateString('de-CH', {
                    month: 'long',
                    year: 'numeric',
                  })
                : ''}
              </Typography>
            </CardHead>
            <CardBody>
              <Box
                display="grid"
                gridTemplateColumns="1fr auto"
                gap={2}
                pb={2}
                sx={{ borderBottom: `1px solid ${eenewsColors.rule}` }}
              >
                <Box>
                  <Typography
                    variant="uiByLineName"
                    component="p"
                    sx={{ margin: 0 }}
                  >
                    {memberPlan?.name ?? 'Mitgliedschaft'}
                  </Typography>
                  <Typography
                    variant="metaInline"
                    component="span"
                    sx={{ color: eenewsColors.inkSoft }}
                  >
                    {invoice?.subscription?.paymentPeriodicity ?? 'Monatlich'}
                  </Typography>
                </Box>
                <Typography
                  variant="displayStatNum"
                  component="span"
                >
                  {formatChf(amount)}
                </Typography>
              </Box>
              <Box
                display="grid"
                gridTemplateColumns="1fr auto"
                pt={2}
                alignItems="baseline"
              >
                <Typography
                  variant="metaEyebrow"
                  component="span"
                  sx={{ color: eenewsColors.inkSoft }}
                >
                  Total fällig
                </Typography>
                <Typography
                  variant="displayStatNum"
                  component="span"
                  sx={{ fontSize: 32 }}
                >
                  {formatChf(amount)}
                </Typography>
              </Box>
            </CardBody>
          </Card>

          {/* Payment methods */}
          <Card id="methoden">
            <CardHead>
              <Typography
                variant="displaySection"
                component="h2"
                sx={{ margin: 0, fontSize: 24 }}
              >
                Zahlart wählen
              </Typography>
              <Typography
                variant="metaInline"
                component="span"
                sx={{ color: eenewsColors.inkSoft }}
              >
                Sichere Verarbeitung
              </Typography>
            </CardHead>
            <CardBody>
              {availablePaymentMethods.length === 0 ?
                <Typography
                  variant="bodyDefault"
                  component="p"
                  sx={{ color: eenewsColors.inkSoft }}
                >
                  Keine Zahlarten verfügbar.
                </Typography>
              : availablePaymentMethods.map(pm => (
                  <PaymentRow
                    key={pm.id}
                    type="button"
                    selected={selectedPaymentMethodId === pm.id}
                    onClick={() => setSelectedPaymentMethodId(pm.id)}
                  >
                    <PaymentIcon>
                      {pm.name?.[0]?.toUpperCase() ?? '?'}
                    </PaymentIcon>
                    <Box>
                      <Typography
                        variant="uiByLineName"
                        component="p"
                        sx={{ margin: '0 0 4px' }}
                      >
                        {pm.name}
                      </Typography>
                      <Typography
                        variant="metaInline"
                        component="span"
                        sx={{ color: eenewsColors.inkSoft }}
                      >
                        {pm.description ?? '—'}
                      </Typography>
                    </Box>
                    <Radio selected={selectedPaymentMethodId === pm.id} />
                  </PaymentRow>
                ))
              }
              <button
                disabled={!selectedPaymentMethodId || loading}
                onClick={handlePay}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '16px 24px',
                  background: eenewsColors.ink,
                  color: eenewsColors.paper,
                  border: 0,
                  borderRadius: 4,
                  fontSize: 15,
                  cursor:
                    selectedPaymentMethodId && !loading ? 'pointer' : (
                      'not-allowed'
                    ),
                  opacity: selectedPaymentMethodId && !loading ? 1 : 0.5,
                }}
              >
                {loading ?
                  'Wird verarbeitet…'
                : `${formatChf(amount)} jetzt bezahlen →`}
              </button>
              {stripeClientSecret ?
                <Typography
                  variant="metaInline"
                  component="p"
                  sx={{ marginTop: 1 }}
                >
                  Stripe-Auth läuft …
                </Typography>
              : null}
            </CardBody>
          </Card>
        </Box>

        {/* Right: timeline + help */}
        <aside>
          <Card>
            <CardHead>
              <Typography
                variant="displaySection"
                component="h2"
                sx={{ margin: 0, fontSize: 22 }}
              >
                Was ist passiert?
              </Typography>
            </CardHead>
            <CardBody>
              <TimelineStep state="done">
                <span className="dot">✓</span>
                <Box>
                  <Typography
                    variant="metaInline"
                    component="p"
                    sx={{ margin: 0, color: eenewsColors.inkSoft }}
                  >
                    {invoice?.createdAt ?
                      new Date(invoice.createdAt).toLocaleString('de-CH')
                    : '—'}
                  </Typography>
                  <Typography
                    variant="bodyTeaserStandard"
                    component="p"
                    className="lbl"
                    sx={{ margin: 0 }}
                  >
                    Rechnung erstellt — {formatChf(amount)}
                  </Typography>
                </Box>
              </TimelineStep>
              <TimelineStep state="failed">
                <span className="dot">!</span>
                <Box>
                  <Typography
                    variant="metaInline"
                    component="p"
                    sx={{ margin: 0, color: eenewsColors.inkSoft }}
                  >
                    {invoice?.dueAt ?
                      new Date(invoice.dueAt).toLocaleString('de-CH')
                    : '—'}
                  </Typography>
                  <Typography
                    variant="bodyTeaserStandard"
                    component="p"
                    className="lbl"
                    sx={{ margin: 0 }}
                  >
                    Abgelehnt durch Bank
                  </Typography>
                </Box>
              </TimelineStep>
              <TimelineStep state="done">
                <span className="dot">✉</span>
                <Box>
                  <Typography
                    variant="metaInline"
                    component="p"
                    sx={{ margin: 0, color: eenewsColors.inkSoft }}
                  >
                    Heute
                  </Typography>
                  <Typography
                    variant="bodyTeaserStandard"
                    component="p"
                    className="lbl"
                    sx={{ margin: 0 }}
                  >
                    E-Mail an dich gesendet
                  </Typography>
                </Box>
              </TimelineStep>
              <TimelineStep state="pending">
                <span className="dot">⏸</span>
                <Box>
                  <Typography
                    variant="metaInline"
                    component="p"
                    sx={{ margin: 0, color: eenewsColors.inkSoft }}
                  >
                    Geplant
                  </Typography>
                  <Typography
                    variant="bodyTeaserStandard"
                    component="p"
                    className="lbl"
                    sx={{ margin: 0 }}
                  >
                    Mitgliedschaft pausiert, falls nicht bezahlt
                  </Typography>
                </Box>
              </TimelineStep>
            </CardBody>
          </Card>

          <Card>
            <CardHead>
              <Typography
                variant="displaySection"
                component="h2"
                sx={{ margin: 0, fontSize: 22 }}
              >
                Brauchst du Hilfe?
              </Typography>
            </CardHead>
            <CardBody>
              <Typography
                variant="bodyTeaserStandard"
                component="p"
                sx={{ margin: '0 0 16px', color: eenewsColors.inkSoft }}
              >
                Etwas funktioniert nicht oder du hast Fragen zur Rechnung?
                Schreib uns — wir antworten meist innerhalb eines Werktags.
              </Typography>
              <Box
                display="flex"
                flexDirection="column"
                gap={1}
              >
                <a
                  href="mailto:abos@ee-news.ch"
                  style={{
                    padding: '10px 16px',
                    border: `1px solid ${eenewsColors.ruleStrong}`,
                    borderRadius: 999,
                    textAlign: 'center',
                    color: eenewsColors.ink,
                    textDecoration: 'none',
                    fontSize: 13,
                  }}
                >
                  abos@ee-news.ch
                </a>
              </Box>
            </CardBody>
          </Card>
        </aside>
      </Layout>
    </>
  );
}

const Guarded = withAuthGuard(PaymentFailedPage) as any;
Guarded.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }
  const { publicRuntimeConfig } = getConfig();
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);
  const sessionProps = await getSessionTokenProps(ctx);
  if (sessionProps.sessionToken) {
    await Promise.all([
      client.query({ query: MeDocument }),
      client.query({ query: NavigationListDocument }),
      client.query({ query: InvoicesDocument }),
    ]);
  }
  return addClientCacheToV1Props(client, sessionProps);
};

export default Guarded;
