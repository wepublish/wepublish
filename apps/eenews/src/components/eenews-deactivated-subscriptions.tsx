import styled from '@emotion/styled';
import { Container, Typography } from '@mui/material';
import { SubscriptionListContainer } from '@wepublish/membership/website';
import { ProductType, useSubscriptionsQuery } from '@wepublish/website/api';
import Link from 'next/link';

import { eenewsColors } from '../theme';

const PageWrap = styled('div')`
  padding: 48px 0 96px;
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

const Lede = styled('p')`
  max-width: 64ch;
  margin: 0 0 48px;
  color: ${eenewsColors.inkSoft};
`;

const Card = styled('section')`
  margin-bottom: 32px;
  border: 1px solid ${eenewsColors.rule};
  background: ${eenewsColors.paper};
`;

const CardHead = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 22px 28px;
  border-bottom: 1px solid ${eenewsColors.rule};
`;

const CardBody = styled('div')`
  padding: 0;
`;

const CtaBanner = styled('section')`
  margin-top: 56px;
  padding: 48px 56px;
  background: ${eenewsColors.ink};
  color: ${eenewsColors.paper};
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  align-items: center;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    padding: 32px 28px;
  }
`;

const CtaEyebrow = styled('span')`
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${eenewsColors.accent};
`;

const CtaButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  background: ${eenewsColors.accent};
  color: ${eenewsColors.ink};
  text-decoration: none;
  font-family: inherit;
  font-size: 15px;
  font-weight: 500;
  border: 0;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${eenewsColors.accentDeep};
  }
`;

const FooterRow = styled('div')`
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid ${eenewsColors.rule};
`;

const SecondaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${eenewsColors.ink};
  text-decoration: none;
  font-family: inherit;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

const EmptyMessage = styled('div')`
  padding: 22px 28px;
  color: ${eenewsColors.inkSoft};
  font-family: inherit;
  font-size: 14px;
`;

export function EenewsDeactivatedSubscriptions() {
  const { data } = useSubscriptionsQuery();
  const subs = data?.userSubscriptions ?? [];

  const cancelledSubscriptions = subs.filter(
    s =>
      !!s.deactivation && s.memberPlan.productType === ProductType.Subscription
  );
  const cancelledDonations = subs.filter(
    s => !!s.deactivation && s.memberPlan.productType === ProductType.Donation
  );

  const subEntryLabel = (n: number) =>
    n === 1 ? '1 Eintrag' : `${n} Einträge`;

  return (
    <Container>
      <PageWrap>
        <Crumb href="/profile">← Mein Konto</Crumb>

        <Typography
          variant="displayMitmachenH1"
          component="h1"
          sx={{ margin: '0 0 12px', color: eenewsColors.ink }}
        >
          Gekündigte Abos
          <Typography
            component="em"
            sx={{
              fontStyle: 'italic',
              fontWeight: 300,
              color: eenewsColors.inkSoft,
            }}
          >
            {' & '}
          </Typography>
          <br />
          Inaktive Spenden
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
        <Lede>
          <Typography
            variant="bodyLeadXl"
            component="span"
            sx={{ fontWeight: 300 }}
          >
            Übersicht über alle Mitgliedschaften, Abos und Spenden, die nicht
            mehr aktiv sind. Du kannst sie jederzeit wieder aktivieren.
          </Typography>
        </Lede>

        <Card>
          <CardHead>
            <Typography
              variant="displayTeaserMd"
              component="h2"
              sx={{ margin: 0, color: eenewsColors.ink }}
            >
              Gekündigte Mitgliedschaften &amp; Abos
            </Typography>
            <Typography
              variant="metaInline"
              component="span"
              sx={{ color: eenewsColors.inkSoft }}
            >
              {subEntryLabel(cancelledSubscriptions.length)}
            </Typography>
          </CardHead>
          <CardBody>
            {cancelledSubscriptions.length === 0 ?
              <EmptyMessage>Keine gekündigten Mitgliedschaften.</EmptyMessage>
            : <SubscriptionListContainer
                filter={subscriptions =>
                  subscriptions.filter(
                    s =>
                      !!s.deactivation &&
                      s.memberPlan.productType === ProductType.Subscription
                  )
                }
              />
            }
          </CardBody>
        </Card>

        <Card>
          <CardHead>
            <Typography
              variant="displayTeaserMd"
              component="h2"
              sx={{ margin: 0, color: eenewsColors.ink }}
            >
              Inaktive Spenden
            </Typography>
            <Typography
              variant="metaInline"
              component="span"
              sx={{ color: eenewsColors.inkSoft }}
            >
              {subEntryLabel(cancelledDonations.length)}
            </Typography>
          </CardHead>
          <CardBody>
            {cancelledDonations.length === 0 ?
              <EmptyMessage>Keine inaktiven Spenden.</EmptyMessage>
            : <SubscriptionListContainer
                filter={subscriptions =>
                  subscriptions.filter(
                    s =>
                      !!s.deactivation &&
                      s.memberPlan.productType === ProductType.Donation
                  )
                }
              />
            }
          </CardBody>
        </Card>

        <CtaBanner>
          <div>
            <CtaEyebrow>Bereit für ein Comeback?</CtaEyebrow>
            <Typography
              variant="displayTeaserLg"
              component="h3"
              sx={{
                margin: '8px 0 12px',
                color: eenewsColors.paper,
                fontSize: 36,
                lineHeight: 1.1,
              }}
            >
              Werde wieder Teil von ee·news.
            </Typography>
            <Typography
              variant="bodyTeaserStandard"
              component="p"
              sx={{
                margin: 0,
                maxWidth: '52ch',
                color: 'rgba(245,240,230,0.8)',
              }}
            >
              Unabhängiger Journalismus zur Energiewende — finanziert durch
              unsere Lesenden. Schon ab CHF 10/Monat.
            </Typography>
          </div>
          <CtaButton href="/mitmachen">Abos ansehen →</CtaButton>
        </CtaBanner>

        <FooterRow>
          <SecondaryLink href="/profile">
            ← Zurück zu „Aktive Abos&quot;
          </SecondaryLink>
        </FooterRow>
      </PageWrap>
    </Container>
  );
}
