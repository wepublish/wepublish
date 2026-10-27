import { useTheme } from '@mui/material';
import {
  alignmentForTeaserBlock,
  BlockRenderer,
  BreakBlock,
  isBreakBlock,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import { BuilderBlockRendererProps } from '@wepublish/website/builder';
import { cond } from 'ramda';
import { useMemo } from 'react';

import { InstagramBanner } from '../../babanews/instagram-banner/instagram-banner';
import { isInstagramBanner } from '../../babanews/instagram-banner/is-instagram-banner';
import { Container } from '../../layout/container';
import { FullWidthContainer } from '../../layout/full-width-container';
import { BabanewsTeaserList } from '../../website-builder-styled/blocks/teaser-list-styled';
import { ListTeaser } from '../blocks/list-teaser';

export const BabanewsBlockRenderer = (props: BuilderBlockRendererProps) => {
  const theme = useTheme();

  const extraBlockMap = useMemo(
    () =>
      cond([
        [
          isInstagramBanner,
          block => (
            <FullWidthContainer backgroundColor={theme.palette.common.black}>
              <Container>
                <InstagramBanner {...block} />
              </Container>
            </FullWidthContainer>
          ),
        ],
        [
          isBreakBlock,
          block => (
            <FullWidthContainer backgroundColor={theme.palette.accent.main}>
              <Container>
                <BreakBlock {...block} />
              </Container>
            </FullWidthContainer>
          ),
        ],
        [
          isTeaserListBlock,
          block => (
            <Container>
              <BabanewsTeaserList>
                {block.teasers.map((teaser, index) => (
                  <ListTeaser
                    key={index}
                    blockStyle={block.blockStyle}
                    index={index}
                    teaser={teaser}
                    alignment={alignmentForTeaserBlock(index, 1)}
                  />
                ))}
              </BabanewsTeaserList>
            </Container>
          ),
        ],
      ]),
    [theme.palette.accent.main, theme.palette.common.black]
  );

  return (
    extraBlockMap(props.block) ?? (
      <Container>
        <BlockRenderer {...props} />
      </Container>
    )
  );
};
