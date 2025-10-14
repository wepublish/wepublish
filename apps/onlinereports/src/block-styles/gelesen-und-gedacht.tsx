import styled from '@emotion/styled';
import { Box } from '@mui/material';
import {
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  TeaserGridBlock,
  TeaserListBlock,
} from '@wepublish/website/api';
import { BuilderTeaserListBlockProps, Link } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { Advertisement } from '../components/advertisement';
import { BlueBox } from '../components/blue-box';
import { GelesenUndGedachtTeaserContent } from '../custom-teasers/gelesen-und-gedacht';

export const isGelesenUndGedacthTeasers = (
  block: BlockContent
): block is TeaserGridBlock | TeaserListBlock =>
  allPass([hasBlockStyle('Gelesen und Gedacht'), isTeaserListBlock])(block);

export const GelesenUndGedachtBlockStyle = ({
  title,
  teasers,
  blockStyle,
  className,
}: Pick<
  BuilderTeaserListBlockProps,
  'title' | 'teasers' | 'blockStyle' | 'className'
>) => {
  const filledTeasers = teasers.filter(isFilledTeaser);

  return (
    <GelesenUndGedachtWrapper>
      <Filler>
        <Advertisement type={'small'} />
      </Filler>

      <BlueBox>
        <TeaserList>
          {filledTeasers.map((teaser, index) => (
            <GelesenUndGedachtTeaserContent
              key={index}
              teaser={teaser}
            />
          ))}
        </TeaserList>

        <Link href={'/a/tag/Gelesen%20&%20gedacht'}>
          <b>Zum Archiv {'->'}</b>
        </Link>
      </BlueBox>
    </GelesenUndGedachtWrapper>
  );
};

const TeaserList = styled('div')`
  display: flex;
  flex-direction: column;
`;

const Filler = styled(Box)``;

const GelesenUndGedachtWrapper = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing(2.5)};

  ${BlueBox} {
    grid-column: span 3;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: span 2;
    }
  }

  ${Filler} {
    grid-column: span 3;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: span 1;
    }
  }
`;
