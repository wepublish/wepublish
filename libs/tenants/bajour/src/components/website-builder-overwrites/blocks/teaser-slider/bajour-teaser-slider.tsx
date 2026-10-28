import styled from '@emotion/styled';
import {
  SliderBall,
  SliderInnerContainer,
  SliderTitle,
  TeaserSlider,
} from '@wepublish/block-content/website';
import {
  BuilderBlockStyleProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

import { TeaserSlide } from './teaser-slide';

const StyledTeaserSlider = styled(TeaserSlider)`
  ${SliderBall} {
    background-color: ${({ theme }) => theme.palette.common.white};
  }

  ${SliderTitle} {
    ${({ theme }) => theme.breakpoints.up('sm')} {
      margin-left: calc(100% / 12);
      margin-right: calc(100% / 12);
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      margin-left: calc((100% / 12) * 2);
      margin-right: calc((100% / 12) * 2);
    }
  }

  ${SliderInnerContainer} {
    position: relative;
    padding-top: ${({ theme }) => theme.spacing(2)};
    padding-bottom: ${({ theme }) => theme.spacing(2)};

    ${({ theme }) => theme.breakpoints.up('sm')} {
      padding-top: ${({ theme }) => theme.spacing(3)};
      padding-bottom: ${({ theme }) => theme.spacing(3)};
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      padding-top: ${({ theme }) => theme.spacing(5)};
    }

    ${({ theme }) => theme.breakpoints.up('xl')} {
      padding-top: ${({ theme }) => theme.spacing(7)};
    }
  }

  ${SliderInnerContainer}::before {
    content: ' ';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: -1;
    background: #feede8;

    ${({ theme }) => theme.breakpoints.up('sm')} {
      left: calc(100% / 12);
      right: calc(100% / 12);
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      left: calc((100% / 12) * 2);
      right: calc((100% / 12) * 2);
    }
  }
`;

export const BajourTeaserSlider = (
  props: BuilderBlockStyleProps['TeaserSlider']
) => {
  return (
    <WebsiteBuilderProvider blocks={{ Teaser: TeaserSlide }}>
      <StyledTeaserSlider {...props} />
    </WebsiteBuilderProvider>
  );
};
