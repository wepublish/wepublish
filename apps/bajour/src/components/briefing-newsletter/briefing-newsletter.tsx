import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { H1 } from '@wepublish/ui';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { ReactComponent as Logo } from '../../logo.svg';
import BaselBriefingBg from '../briefing/basel.jpg';

const BriefingNewsletterWrapper = styled('article')`
  display: grid;
  grid-template-columns: 3fr 2fr;
  max-width: ${({ theme }) => theme.spacing(120)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: ${({ theme }) => theme.spacing(3)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin: 0 auto;
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    gap: ${({ theme }) => theme.spacing(4)};
  }
`;

const BecomeMember = styled('div')`
  padding: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.secondary.main};
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
  justify-items: center;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    padding: ${({ theme }) => theme.spacing(4)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

const BaselBriefing = styled(BecomeMember)`
  background-color: ${({ theme }) => theme.palette.secondary.main};
  background-image: url(${BaselBriefingBg.src});
  background-size: cover;
  background-repeat: no-repeat;
`;

const Heading = styled('div')`
  color: ${({ theme }) => theme.palette.common.white};
  display: grid;
  text-align: center;
`;

const BaselBriefingTitle = styled(H1)`
  font-weight: bold;
  font-size: ${({ theme }) => theme.spacing(4)};
  text-transform: uppercase;
  font-size: 25px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    font-size: 43px;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 46px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    font-size: 52px;
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    font-size: 77px;
  }
`;

const BaselBriefingSubtitle = styled('div')`
  font-weight: bold;
  font-size: 10px;
  text-transform: uppercase;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    font-size: 17px;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 18px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    font-size: 20px;
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    font-size: 29px;
  }
`;

const BajourLogo = styled(Logo)`
  font-size: 25px;
  height: 1.25em;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    font-size: 43px;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 46px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    font-size: 52px;
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    font-size: 77px;
  }
`;

const SharedButton = styled(Button)`
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(2)}`};
  font-size: 9px;
  font-weight: 600;
  text-align: center;
  border: 2px solid currentColor;
  text-transform: uppercase;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    font-size: 18px;
    padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(2.5)}`};
  }
`;

const BaselBriefingButton = styled(SharedButton)`
  color: ${({ theme }) => theme.palette.common.white};
`;

const BecomeMemberButton = styled(SharedButton)`
  color: ${({ theme }) => theme.palette.common.black};
`;

export const BriefingNewsletter = () => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();

  return (
    <BriefingNewsletterWrapper>
      <BaselBriefing>
        <Heading>
          <BaselBriefingTitle>Basel Briefing</BaselBriefingTitle>
          <BaselBriefingSubtitle>
            Das wichtigste für den Tag
          </BaselBriefingSubtitle>
        </Heading>

        <BaselBriefingButton
          LinkComponent={Link}
          href="https://labs.bajour.ch/react/baselbriefing"
        >
          Jetzt Abonnieren
        </BaselBriefingButton>
      </BaselBriefing>

      <BecomeMember>
        <BajourLogo />

        <BecomeMemberButton
          LinkComponent={Link}
          href="/mitmachen?memberPlanBySlug=bajour-member&additionalMemberPlans=upsell"
        >
          Jetzt Member Werden
        </BecomeMemberButton>
      </BecomeMember>
    </BriefingNewsletterWrapper>
  );
};
