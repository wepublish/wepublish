import styled from '@emotion/styled';
import { Container, Typography } from '@mui/material';
import Link from 'next/link';

import { eenewsColors } from '../src/theme';

/**
 * /payment-confirmation — referenced by `MemberPlan.confirmationPage`. Shown
 * after a registration that requires email confirmation.
 */
const Frame = styled('section')`
  background: ${eenewsColors.paperWarm};
  padding: 72px 0;
  border-bottom: 2px solid ${eenewsColors.ink};
`;

const Body = styled(Container)`
  padding-top: 56px;
  padding-bottom: 80px;
  max-width: 640px;
`;

export default function PaymentConfirmation() {
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
            sx={{ margin: 0, color: eenewsColors.ink, maxWidth: '16ch' }}
          >
            Bitte bestätige deine Anmeldung.
          </Typography>
        </Container>
      </Frame>
      <Body>
        <Typography
          variant="bodyLeadXl"
          component="p"
          sx={{ margin: 0, color: eenewsColors.ink }}
        >
          Wir haben dir eine E-Mail mit einem Bestätigungslink geschickt. Klicke
          auf den Link, um deine Mitgliedschaft zu aktivieren.
        </Typography>
        <Link
          href="/"
          style={{
            marginTop: 32,
            display: 'inline-block',
            padding: '12px 22px',
            background: 'transparent',
            color: eenewsColors.ink,
            textDecoration: 'none',
            borderRadius: 999,
            border: `1px solid ${eenewsColors.ruleStrong}`,
          }}
        >
          Zur Startseite
        </Link>
      </Body>
    </>
  );
}
