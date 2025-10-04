import styled from '@emotion/styled';
import {
  BaseTeaser,
  TeaserImageWrapper,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
} from '@wepublish/block-content/website';
import { ImageWrapper } from '@wepublish/image/website';

export const FlimmerTeaser = styled(BaseTeaser)`
  &,
  &:hover {
    ${TeaserPreTitleNoContent},
    ${TeaserPreTitleWrapper} {
      background-color: unset;
    }
  }

  &:hover ${ImageWrapper} {
    transform: unset;
  }

  ${TeaserImageWrapper}:empty {
    min-height: unset;
  }
`;
