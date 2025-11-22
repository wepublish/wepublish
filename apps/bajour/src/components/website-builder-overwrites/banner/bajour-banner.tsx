import styled from '@emotion/styled';
import {
  Banner,
  BannerCloseButton,
  BannerContentWrapper,
  BannerCtaText,
  BannerImage,
  BannerText,
  BannerTitle,
} from '@wepublish/banner/website';

const BajourBanner = styled(Banner)(
  ({ theme }) => `
${BannerContentWrapper} {
  padding: ${theme.spacing(2)};
}

${BannerCloseButton} {
  top: ${theme.spacing(2)};
  right: ${theme.spacing(2)};
}

${BannerCtaText} {
  display: none;
}

&[data-collapsed='true'] {
  top: unset;
  display: block;
  border-radius: 4px;
  grid-template-columns: 1fr;
  position: fixed;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;

  ${theme.breakpoints.up('md')} {
    width: 20%;
  }

  ${BannerCtaText} {
    display: block;
    margin-top: 0;
  }

  ${BannerImage}, ${BannerTitle}, ${BannerText}, ${BannerCloseButton}, [data-role='CANCEL'], [data-role='OTHER'] {
    display: none;
  }
}`
);

export { BajourBanner };
