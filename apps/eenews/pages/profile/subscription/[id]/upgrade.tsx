import styled from '@emotion/styled';
import { Container, Typography } from '@mui/material';
import { UpgradeContainer } from '@wepublish/membership/website';
import { withAuthGuard } from '@wepublish/utils/website';
import { NextPage, NextPageContext } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { eenewsColors } from '../../../../src/theme';

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

function UpgradePage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  if (!id) {
    return null;
  }

  return (
    <Container>
      <PageWrap>
        <Crumb href={`/profile/subscription/${id}`}>
          ← Zurück zur Mitgliedschaft
        </Crumb>
        <Typography
          variant="displayMitmachenH1"
          component="h1"
          sx={{ margin: '0 0 12px', color: eenewsColors.ink }}
        >
          Plan ändern
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
        <Typography
          variant="bodyLeadXl"
          component="p"
          sx={{
            margin: '0 0 32px',
            color: eenewsColors.inkSoft,
            fontWeight: 300,
            maxWidth: '64ch',
          }}
        >
          Wechsle zu einem anderen Mitgliedschafts-Plan. Bereits bezahlte Tage
          werden dir als Gutschrift auf den ersten Beitrag des neuen Plans
          angerechnet.
        </Typography>
        <UpgradeContainer upgradeSubscriptionId={id} />
      </PageWrap>
    </Container>
  );
}

const Guarded = withAuthGuard(UpgradePage) as NextPage;
Guarded.getInitialProps = async (ctx: NextPageContext) => {
  // Ensures the wepublish session-token cookie is consumed identically to
  // sibling profile routes (no auth-guard redirect race in dev).
  return {} as Record<string, unknown>;
};

export default Guarded;
