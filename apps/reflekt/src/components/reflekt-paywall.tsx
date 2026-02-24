import styled from '@emotion/styled';
import { Button, TextField, Typography } from '@mui/material';
import {
  useSetIntendedRoute,
  useUser,
} from '@wepublish/authentication/website';
import { forceHideBanner } from '@wepublish/banner/website';
import { BuilderPaywallProps } from '@wepublish/website/builder';
import { useIntersectionObserver } from 'usehooks-ts';

const PaywallCard = styled('div')`
  display: grid !important;
  background-color: #f5ff64;
  color: #000000;
  border-radius: 24px;
  padding: ${({ theme }) => theme.spacing(5)};
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 600px;
  margin: ${({ theme }) => theme.spacing(4)} auto;
`;

const PaywallHeading = styled(Typography)`
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: 1.75rem;
  line-height: 1.2;
  text-transform: uppercase;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 2.2rem;
  }
`;

const PaywallBody = styled(Typography)`
  font-size: 1rem;
  line-height: 1.6;
  color: #333333;
`;

const PaywallForm = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const PaywallTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    background-color: #ffffff;
    border-radius: 9999px;
  }

  & .MuiOutlinedInput-notchedOutline {
    border-color: rgba(0, 0, 0, 0.2);
  }
`;

const PaywallNote = styled(Typography)`
  font-size: 0.8rem;
  color: #555555;
  text-align: center;
`;

export const ReflektPaywall = ({
  className,
  alternativeSubscribeUrl,
}: BuilderPaywallProps) => {
  const { hasUser } = useUser();
  const { isIntersecting, ref } = useIntersectionObserver({
    initialIsIntersecting: false,
  });
  const setIntendedRoute = useSetIntendedRoute();

  return (
    <PaywallCard
      className={className}
      ref={ref}
    >
      <PaywallHeading>Kostenlos weiterlesen?</PaywallHeading>

      <PaywallBody>
        Melde dich mit deiner E-Mail-Adresse an und lies unsere Artikel gratis —
        als Newsletter oder direkt auf der Website.
      </PaywallBody>

      <PaywallForm>
        <PaywallTextField
          placeholder="Deine E-Mail-Adresse"
          type="email"
          size="small"
          fullWidth
        />

        <Button
          variant="cta-black"
          size="large"
          fullWidth
          href={alternativeSubscribeUrl ?? '/mitmachen'}
          onClick={setIntendedRoute}
        >
          Ich bin dabei
        </Button>
      </PaywallForm>

      {!hasUser && (
        <PaywallNote>
          Bereits Mitglied?{' '}
          <a
            href="/login"
            style={{ color: 'inherit', fontWeight: 600 }}
            onClick={setIntendedRoute}
          >
            Hier einloggen
          </a>
        </PaywallNote>
      )}

      {isIntersecting && forceHideBanner}
    </PaywallCard>
  );
};
