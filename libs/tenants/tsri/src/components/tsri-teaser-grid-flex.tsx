import styled from '@emotion/styled';
import { css } from '@mui/material';
import { fixFlexTeasers } from '@wepublish/block-content/website';
import {
  BuilderTeaserGridFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

export const TeaserGridFlexBlockWrapper = styled('ul')`
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(5)};
  grid-template-columns: 1fr;
  align-items: stretch;
  list-style: none;
  margin: 0;
  padding: 0;

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr 1fr;
    }

    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(12, 1fr);
    }
  `}
`;

export const TsriTeaserGridFlex = ({
  flexTeasers,
  blockStyle,
  className,
}: BuilderTeaserGridFlexBlockProps) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const sortedTeasers = useMemo(
    () => (flexTeasers ? fixFlexTeasers(flexTeasers) : []),
    [flexTeasers]
  );

  return (
    <TeaserGridFlexBlockWrapper className={className}>
      {sortedTeasers.map((teaser, index) => (
        <Teaser
          key={index}
          index={index}
          {...teaser}
          blockStyle={blockStyle}
        />
      ))}
    </TeaserGridFlexBlockWrapper>
  );
};
