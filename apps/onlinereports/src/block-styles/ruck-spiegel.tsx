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
import {
  BuilderTeaserListBlockProps,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { Advertisement } from '../components/advertisement';
import { BlueBox } from '../components/blue-box';
import { RuckSpiegelTeaserContent } from '../custom-teasers/ruck-spiegel';

export const isRuckSpiegelTeasers = (
  block: BlockContent
): block is TeaserGridBlock | TeaserListBlock =>
  allPass([hasBlockStyle('RuckSpiegel'), isTeaserListBlock])(block);

export const RuckSpiegelBlockStyle = ({
  title,
  teasers,
  blockStyle,
  className,
}: Pick<
  BuilderTeaserListBlockProps,
  'title' | 'teasers' | 'blockStyle' | 'className'
>) => {
  const filledTeasers = teasers.filter(isFilledTeaser);

  const {
    elements: { H2 },
  } = useWebsiteBuilder();

  return (
    <RuckSpiegelTeaserListWrapper>
      <BlueBox>
        <TeaserList>
          <H2 gutterBottom>{title}</H2>
          {filledTeasers.map((teaser, index) => (
            <RuckSpiegelTeaserContent
              key={index}
              teaser={teaser}
            />
          ))}
        </TeaserList>

        <Link href={'/a/tag/RückSpiegel'}>
          <b>Zum Archiv {'->'}</b>
        </Link>
      </BlueBox>

      <Filler>
        <Advertisement type={'small'} />
      </Filler>
    </RuckSpiegelTeaserListWrapper>
  );
};

const TeaserList = styled('div')`
  display: flex;
  flex-direction: column;
`;

const Filler = styled(Box)``;

const RuckSpiegelTeaserListWrapper = styled(Box)`
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
