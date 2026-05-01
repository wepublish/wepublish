import styled from '@emotion/styled';
import { Box, Container, Typography } from '@mui/material';
import {
  getSessionTokenProps,
  ssrAuthLink,
  SubscribePage,
} from '@wepublish/utils/website';
import { getV1ApiClient, PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';
import getConfig from 'next/config';
import Link from 'next/link';
import { ComponentProps } from 'react';

import {
  CrowdfundingsDocument,
  useCrowdfundingsQuery,
} from '../src/lib/crowdfundings-query';
import { eenewsColors } from '../src/theme';

const Hero = styled('section')`
  padding: 64px 0 56px;
  border-bottom: 1px solid ${eenewsColors.rule};
  background:
    radial-gradient(
      circle at 80% 20%,
      rgba(217, 234, 123, 0.25),
      transparent 55%
    ),
    ${eenewsColors.paper};
`;

const HeroInner = styled(Container)``;

const Crumbs = styled('div')`
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${eenewsColors.inkSoft};
  margin-bottom: 32px;
`;

const HeroH1Wrap = styled('div')`
  margin: 0 0 32px;
`;

const HeroEm = styled('em')`
  font-style: italic;
  font-weight: 300;
  color: ${eenewsColors.inkSoft};
`;

const HeroLead = styled('div')`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 48px;
  padding-top: 32px;
  border-top: 1px solid ${eenewsColors.rule};
  align-items: start;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const StatRow = styled('div')`
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
`;

const StatItem = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Crowdfund = styled('section')`
  padding: 32px 0;
  border-bottom: 1px solid ${eenewsColors.rule};
  background: ${eenewsColors.paperWarm};
`;

const CrowdfundGrid = styled(Container)`
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 32px;
  align-items: center;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const Track = styled('div')`
  height: 6px;
  background: ${eenewsColors.rule};
  border-radius: 999px;
  overflow: hidden;
  position: relative;
`;

const Fill = styled('div')<{ percent: number }>`
  height: 100%;
  background: ${eenewsColors.ink};
  width: ${({ percent }) => percent}%;
`;

const PlanWrapper = styled('div')`
  padding: 56px 0;
`;

// CMS amounts are stored in minor units (cents) — convert to major (CHF) for display.
const centsToMajor = (cents: number) => Math.round(cents / 100);

// Stable thousands separator (Swiss apostrophe). Avoids the
// SSR-vs-CSR locale-data drift on `de-CH` Intl.NumberFormat output, where
// Node.js ICU emits U+2019 (’) while many browsers emit U+0027 (') — that
// mismatch fires a React hydration warning ("Text content did not match").
const formatThousands = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'");

const formatChfThousands = (chf: number) => {
  if (chf >= 1000) {
    return `CHF ${Math.round(chf / 1000)}k`;
  }
  return `CHF ${formatThousands(chf)}`;
};

export default function Mitmachen(props: ComponentProps<typeof SubscribePage>) {
  const { data } = useCrowdfundingsQuery();
  const crowdfunding = data?.crowdfundings?.[0];

  // Pre-seed / SSR fallbacks mirror the v2 design copy.
  const fallbackTargetChf = 270_000;
  const fallbackRaisedChf = 184_200;
  const fallbackSubscribers = 3412;

  const targetCents = crowdfunding?.activeGoal?.amount;
  const revenueCents = crowdfunding?.revenue ?? null;

  const fundraiseTarget =
    targetCents != null ? centsToMajor(targetCents) : fallbackTargetChf;
  const fundraiseRaised =
    revenueCents != null ? centsToMajor(revenueCents) : fallbackRaisedChf;
  const percent =
    fundraiseTarget > 0 ?
      Math.min(100, Math.round((fundraiseRaised / fundraiseTarget) * 100))
    : 0;

  const subscribers = crowdfunding?.subscriptions ?? fallbackSubscribers;
  const campaignName = crowdfunding?.name ?? 'Frühjahrs-Aktion 2026';

  return (
    <>
      <Hero>
        <HeroInner>
          <Crumbs>
            <Link
              href="/"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              Home
            </Link>
            &nbsp;/&nbsp;<span>Mitmachen</span>
          </Crumbs>
          <HeroH1Wrap>
            <Typography
              variant="displayMitmachenH1"
              component="h1"
              sx={{ margin: 0, color: eenewsColors.ink }}
            >
              Energie­wende
              <br />
              braucht
              <br />
              <HeroEm>Lesende.</HeroEm>
            </Typography>
          </HeroH1Wrap>
          <HeroLead>
            <Typography
              variant="bodyLeadXl"
              component="p"
              sx={{
                margin: 0,
                color: eenewsColors.ink,
                maxWidth: '56ch',
                fontWeight: 300,
              }}
            >
              ee·news ist klein, unabhängig, werbefrei. Kein Investor, keine
              Konzern­mutter, keine Paywall vor wichtigen Texten. Drei Viertel
              der Mittel kommen direkt von Mitgliedern. Wer mitmacht, sichert
              die Recherche zur Schweizer Energiewende — Monat für Monat.
            </Typography>
            <StatRow>
              <StatItem>
                <Typography
                  variant="metaEyebrow"
                  component="span"
                >
                  Mitglieder
                </Typography>
                <Typography
                  variant="displayStatNum"
                  component="span"
                >
                  {formatThousands(subscribers)}
                </Typography>
              </StatItem>
              <StatItem>
                <Typography
                  variant="metaEyebrow"
                  component="span"
                >
                  Im Crowdfunding
                </Typography>
                <Typography
                  variant="displayStatNum"
                  component="span"
                >
                  {formatChfThousands(fundraiseRaised)}
                </Typography>
              </StatItem>
              <StatItem>
                <Typography
                  variant="metaEyebrow"
                  component="span"
                >
                  {crowdfunding?.activeGoal?.title ?? 'Jahresziel 2026'}
                </Typography>
                <Typography
                  variant="displayStatNum"
                  component="span"
                >
                  {formatChfThousands(fundraiseTarget)}
                </Typography>
              </StatItem>
            </StatRow>
          </HeroLead>
        </HeroInner>
      </Hero>

      <Crowdfund>
        <CrowdfundGrid>
          <Box>
            <Typography
              variant="displayTeaserMd"
              component="h2"
              sx={{ margin: 0 }}
            >
              {campaignName}
            </Typography>
            <Typography
              variant="metaEyebrow"
              component="div"
              sx={{ marginTop: 0.5, color: eenewsColors.inkSoft }}
            >
              Crowdfunding · läuft bis 30. Juni
            </Typography>
          </Box>
          <Box
            display="flex"
            flexDirection="column"
            gap={1}
          >
            <Track>
              <Fill percent={percent} />
            </Track>
            <Box
              display="flex"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
              sx={{
                fontSize: 11,
                letterSpacing: '0.06em',
                color: eenewsColors.inkSoft,
              }}
            >
              <span>
                <strong style={{ fontSize: 18, color: eenewsColors.ink }}>
                  CHF {formatThousands(fundraiseRaised)}
                </strong>{' '}
                eingegangen
              </span>
              <span>
                {percent}% von Ziel CHF {formatThousands(fundraiseTarget)}
              </span>
              <span>49 Tage offen</span>
            </Box>
          </Box>
          <a
            href="#plans"
            style={{
              padding: '12px 22px',
              background: eenewsColors.ink,
              color: eenewsColors.paper,
              textDecoration: 'none',
              borderRadius: 999,
              whiteSpace: 'nowrap',
            }}
          >
            Beitrag wählen →
          </a>
        </CrowdfundGrid>
      </Crowdfund>

      <PlanWrapper id="plans">
        <Container>
          <SubscribePage {...props} />
        </Container>
      </PlanWrapper>
    </>
  );
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
  const { publicRuntimeConfig } = getConfig();
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await Promise.all([
    client.query({
      query: PageDocument,
      variables: { slug: 'mitmachen' },
    }),
    client.query({ query: CrowdfundingsDocument }),
  ]);

  return SubscribePage.getInitialProps(ctx);
};
