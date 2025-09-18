import {
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
} from '../../teaser/base-teaser';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { BaseTeaser, BuilderTeaserProps } from '@wepublish/website/builder';

export const teaserLeftImage = css`
  grid-template-areas:
    'image .'
    'image pretitle'
    'image title'
    'image lead'
    'image authors'
    'image .';
  grid-template-columns: ${(100 / 12) * 7}% 1fr;
`;

export const teaserRightImage = css`
  grid-template-areas:
    '. image'
    'pretitle image'
    'title image'
    'lead image'
    'authors image'
    '. image';
  grid-template-columns: 1fr ${(100 / 12) * 7}%;
`;

export const AltTeaser = styled(BaseTeaser)`
  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-rows: repeat(6, minmax(0, auto));

    ${({ index }) =>
      (index ?? 0) % 2 === 0 ? teaserRightImage : teaserLeftImage}
  }

  ${TeaserPreTitleNoContent} {
    grid-area: pretitle;
    width: 20%;
    height: 5px;
  }

  ${TeaserPreTitleWrapper} {
    height: auto;
    width: max-content;
  }

  ${TeaserPreTitle} {
    transform: initial;
  }
`;

export const AlternatingTeaser = ({
  alignment,
  ...props
}: BuilderTeaserProps) => {
  return (
    <AltTeaser
      {...props}
      alignment={{ ...alignment, w: 1 }}
    />
  );
};
