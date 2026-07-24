import styled from '@emotion/styled';
import {
  ImageBlockCaption,
  ImageSlider,
} from '@wepublish/block-content/website';
import { ImageWrapper } from '@wepublish/image/website';
import { BuilderBlockStyleProps } from '@wepublish/website/builder';

export const HauptstadtImageSlider = styled(
  (props: BuilderBlockStyleProps['ImageSlider']) => (
    <ImageSlider
      {...props}
      slidesPerViewConfig={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}
    />
  )
)(
  ({ theme }) => `
  ${ImageWrapper} {
    object-fit: cover;
    height: 350px;

    ${theme.breakpoints.up('lg')} {
      height: 500px;
    }
  }

  ${ImageBlockCaption} {
    justify-self: start;
  }
`
);
