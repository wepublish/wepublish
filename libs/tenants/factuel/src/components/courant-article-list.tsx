import styled from '@emotion/styled';
import { FullArticleTeaserFragment, TeaserType } from '@wepublish/website/api';
import {
  BuilderArticleListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { courantTokens } from '../brand-tokens';

const { pageGap, pageMaxWidth } = courantTokens.layout;

const CourantArticleListWrapper = styled('section')`
  display: grid;
  row-gap: ${({ theme }) => theme.spacing(pageGap.xs)};
  width: 100%;
  max-width: ${pageMaxWidth}px;
  margin-inline: auto;
`;

const CourantArticleListHeading = styled('h2')`
  margin: 0;
  font-family: var(--courant-display);
  font-size: ${courantTokens.typography.headings.page.h4};
  font-weight: 500;
  letter-spacing: -0.0075em;
  line-height: 1;
`;

const articleToTeaser = (
  article: FullArticleTeaserFragment['article']
): FullArticleTeaserFragment => ({
  __typename: 'ArticleTeaser',
  type: TeaserType.Article,
  article,
  image: null,
  lead: null,
  preTitle: null,
  title: null,
});

export const CourantArticleList = ({
  data,
  className,
}: BuilderArticleListProps) => {
  const {
    blocks: { TeaserGrid },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  const teasers = useMemo(
    () =>
      data?.articles?.nodes.map(article =>
        articleToTeaser(article as FullArticleTeaserFragment['article'])
      ) ?? [],
    [data?.articles?.nodes]
  );

  if (!teasers.length) {
    return null;
  }

  return (
    <CourantArticleListWrapper className={className}>
      <CourantArticleListHeading>
        {t('article.related')}
      </CourantArticleListHeading>

      <TeaserGrid
        title={null}
        numColumns={3}
        teasers={teasers}
      />
    </CourantArticleListWrapper>
  );
};
