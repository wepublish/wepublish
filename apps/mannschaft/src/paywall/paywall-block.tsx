import styled from '@emotion/styled';
import { useWebsiteBuilder } from '@wepublish/website/builder';

export const PaywallBlockWrapper = styled('div')`
  display: grid !important; // exception as it should always be shown
  background-color: ${({ theme }) => theme.palette.accent.light};
  color: ${({ theme }) => theme.palette.accent.contrastText};
  padding: ${({ theme }) => theme.spacing(4)};
  justify-content: center;
  align-items: center;
`;

const PaywallButtonWrapper = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: ${({ theme }) => theme.spacing(4)};
  row-gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: 1fr 1fr;
  }
`;
const ParagraphBeneathTitle = styled('p')`
  padding-top: ${({ theme }) => theme.spacing(1)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
  row-gap: unset;
`;

export const PaywallBlock = () => {
  const {
    elements: { Button, Link, H3 },
  } = useWebsiteBuilder();

  return (
    <PaywallBlockWrapper>
      <H3>Unterstütze LGBTIQ-Journalismus</H3>

      <ParagraphBeneathTitle>
        Unsere Inhalte sind für dich gemacht, aber wir sind auf deinen Support
        angewiesen. Mit einem Abo erhältst du Zugang zu allen Artikeln – und
        hilfst uns dabei, weiterhin unabhängige Berichterstattung zu liefern.
        Werde jetzt Teil der MANNSCHAFT!
      </ParagraphBeneathTitle>

      <PaywallButtonWrapper>
        <Button
          variant="contained"
          LinkComponent={Link}
          href={'/mitmachen'}
        >
          Abonnent*in werden
        </Button>

        <Button
          variant="outlined"
          LinkComponent={Link}
          href={'/login'}
        >
          Login
        </Button>
      </PaywallButtonWrapper>
    </PaywallBlockWrapper>
  );
};
