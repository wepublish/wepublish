import styled from '@emotion/styled';
import { Box } from '@mui/material';
import {
  alignmentForTeaserBlock,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  TeaserGridBlock,
  TeaserListBlock,
} from '@wepublish/website/api';
import {
  BuilderTeaserListBlockProps,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { Advertisement } from '../components/advertisement';
import { BlueBox } from '../components/blue-box';
import { NewsTeaser } from '../custom-teasers/news';

export const isNewsTeasers = (
  block: BlockContent
): block is TeaserGridBlock | TeaserListBlock =>
  allPass([hasBlockStyle('News'), isTeaserListBlock])(block);

export const NewsBlockStyle = ({
  title,
  teasers,
  blockStyle,
  className,
}: Pick<
  BuilderTeaserListBlockProps,
  'teasers' | 'title' | 'blockStyle' | 'className'
>) => {
  const filledTeasers = teasers.filter(isFilledTeaser);
  const numColumns = 1;
  const {
    elements: { H2 },
  } = useWebsiteBuilder();

  return (
    <>
      <NewsTeaserListWrapper>
        <BlueBox>
          <TeaserList>
            <H2 gutterBottom>{title}</H2>
            {filledTeasers.map((teaser, index) => (
              <NewsTeaser
                key={index}
                teaser={teaser}
                numColumns={numColumns}
                alignment={alignmentForTeaserBlock(index, numColumns)}
                blockStyle={blockStyle}
                index={index}
              />
            ))}
          </TeaserList>

          <Link href={'/a/tag/news'}>
            <b>Weitere News {'->'}</b>
          </Link>
        </BlueBox>

        <Filler>
          <Advertisement type={'small'} />
        </Filler>
      </NewsTeaserListWrapper>
    </>
  );
};

const TeaserList = styled('div')`
  display: flex;
  flex-direction: column;
`;

const Filler = styled(Box)``;

const NewsTeaserListWrapper = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  row-gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    row-gap: ${({ theme }) => theme.spacing(2.5)};
    column-gap: ${({ theme }) => theme.spacing(2.5)};
  }

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
