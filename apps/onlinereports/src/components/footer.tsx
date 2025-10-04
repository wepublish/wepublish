import styled from '@emotion/styled';
import {
  FooterCategory,
  FooterCategoryLinks,
  FooterContainer,
  FooterName,
  FooterPaperWrapper,
} from '@wepublish/navigation/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';

const OnlineReportsFooterContainer = styled(FooterContainer)`
  grid-column: -1/1;

  ${FooterPaperWrapper} {
    color: ${({ theme }) => theme.palette.common.white};
    background-color: #323232;
    font-size: 18px !important;
  }

  ${FooterName} {
    font-size: 18px;
    text-transform: unset;
  }

  ${FooterCategoryLinks} {
    font-size: 18px;
  }
`;

export const OnlineReportsFooter = () => {
  const {
    elements: { H6 },
  } = useWebsiteBuilder();
  return (
    <OnlineReportsFooterContainer
      slug={''}
      categorySlugs={[['footer']]}
      wepublishLogo="hidden"
    >
      <FooterCategory>
        <FooterCategoryLinks>
          <H6>OnlineReports GmbH</H6>
          <H6>Münsterplatz 8, 4051 Basel</H6>
          <H6>redaktion@onlinereports.ch</H6>
          <H6>+41 76 392 04 76 / +41 77 443 36 35</H6>
        </FooterCategoryLinks>
      </FooterCategory>
    </OnlineReportsFooterContainer>
  );
};
