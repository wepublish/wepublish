/**
 * `PrintLogo` is a React component that renders the publication's logo,
 * intended exclusively for print layouts. By default, the logo is hidden
 * on screen and only appears when the page is printed.
 */

import styled from '@emotion/styled';
import { css } from '@mui/material';
import { usePeerProfileQuery } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

export const PrintLogoWrapper = styled('div')`
  display: none;
  padding-top: ${({ theme }) => theme.spacing(6)};
  padding-bottom: ${({ theme }) => theme.spacing(6)};

  @media print {
    display: block !important;
  }
`;

const PrintLogoInnerWrapper = styled('div')`
  display: flex;
  justify-content: center;
`;

const imageStyles = () => css`
  width: 350px;
`;

export const PrintLogo = () => {
  const { data: peerInfoData } = usePeerProfileQuery();
  const logo = peerInfoData?.peerProfile.logo;

  const {
    elements: { Image },
  } = useWebsiteBuilder();

  return (
    <PrintLogoWrapper>
      <PrintLogoInnerWrapper>
        {!!logo && (
          <Image
            image={logo}
            css={imageStyles}
            loading="eager"
            fetchPriority="high"
          />
        )}
      </PrintLogoInnerWrapper>
    </PrintLogoWrapper>
  );
};
