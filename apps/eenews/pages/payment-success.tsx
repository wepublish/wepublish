import styled from '@emotion/styled';
import { Container, Typography } from '@mui/material';
import Link from 'next/link';

import { eenewsColors } from '../src/theme';

/**
 * /payment-success — referenced by `MemberPlan.successPage`. Shows after a
 * successful subscribe / pay-invoice. Takes precedence over the [slug].tsx
 * catch-all that would otherwise render the CMS stub page seeded as
 * 'payment-success'.
 */
const Frame = styled('section')`
  background: ${eenewsColors.section};
  padding: 80px 0;
  border-bottom: 2px solid ${eenewsColors.ink};
`;

const Body = styled(Container)`
  padding-top: 56px;
  padding-bottom: 80px;
  max-width: 640px;
`;

export default function PaymentSuccess() {
  return (
    <>
      <Frame>
        <Container>
          <Typography
            variant="metaEyebrow"
            component="div"
            sx={{ marginBottom: 1 }}
          >
            Mitgliedschaft
          </Typography>
          <Typography
            variant="displayPageH1"
            component="h1"
            sx={{ margin: 0, color: eenewsColors.ink, maxWidth: '14ch' }}
          >
            Danke!
          </Typography>
        </Container>
      </Frame>
      <Body>
        <Typography
          variant="bodyLeadXl"
          component="p"
          sx={{ margin: 0, color: eenewsColors.ink }}
        >
          Deine Mitgliedschaft ist aktiv. Wir freuen uns, dass du dabei bist —
          ohne Lesende kein ee·news.
        </Typography>
        <Typography
          variant="bodyDefault"
          component="p"
          sx={{ marginTop: 3, color: eenewsColors.inkSoft }}
        >
          Du erhältst gleich eine Bestätigung per E-Mail. Den nächsten
          Newsletter bekommst du am kommenden Donnerstag.
        </Typography>
        <Link
          href="/profile"
          style={{
            marginTop: 32,
            display: 'inline-block',
            padding: '12px 22px',
            background: eenewsColors.ink,
            color: eenewsColors.paper,
            textDecoration: 'none',
            borderRadius: 999,
          }}
        >
          Zu meinem Konto →
        </Link>
      </Body>
    </>
  );
}
