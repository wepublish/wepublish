import styled from '@emotion/styled';
import {
  hasBlockStyle,
  isFilledTeaser,
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';

import { BlockHeader } from '../block-header';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { ArticleRow, ArticleRows } from './article-row';

export const isArticleList = ({
  blockStyle,
}: Pick<BuilderTeaserSlotsBlockProps, 'blockStyle'>) =>
  hasBlockStyle(WepBlockStyles.ArticleList)({ blockStyle });

export const ArticleListWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 60px;
  }
`;

/** The teasers of the block below each other, as on the page of all articles */
export const ArticleList = ({
  className,
  title,
  teasers,
}: BuilderTeaserSlotsBlockProps) => (
  <ArticleListWrapper className={className}>
    <BlockHeader title={title} />

    <ArticleRows>
      {teasers.filter(isFilledTeaser).map((teaser, index) => (
        <ArticleRow
          key={index}
          href={selectTeaserUrl(teaser)}
          target={selectTeaserTarget(teaser)}
          image={selectTeaserImage(teaser)}
          title={selectTeaserTitle(teaser)}
          lead={selectTeaserLead(teaser)}
          authors={selectTeaserAuthors(teaser)}
          date={selectTeaserDate(teaser)}
        />
      ))}
    </ArticleRows>
  </ArticleListWrapper>
);
