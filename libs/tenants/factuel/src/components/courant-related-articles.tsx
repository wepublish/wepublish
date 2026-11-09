import styled from '@emotion/styled';
import { ArticleListContainer } from '@wepublish/article/website';
import { FullArticleFragment } from '@wepublish/website/api';
import { useTranslation } from 'react-i18next';

import { courantTokens } from '../brand-tokens';

const { pageGap, pageMaxWidth } = courantTokens.layout;

const Wrapper = styled('section')`
  display: grid;
  row-gap: ${({ theme }) => theme.spacing(pageGap.xs)};
  width: 100%;
  max-width: ${pageMaxWidth}px;
  margin-inline: auto;
`;

const Heading = styled('h2')`
  margin: 0;
  font-family: var(--courant-display);
  font-size: ${courantTokens.typography.headings.page.h4};
  font-weight: 500;
  letter-spacing: -0.0075em;
  line-height: 1;
`;

export type CourantRelatedArticlesProps = {
  article: Pick<FullArticleFragment, 'id' | 'tags'>;
};

export const CourantRelatedArticles = ({
  article,
}: CourantRelatedArticlesProps) => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <Heading>{t('article.related')}</Heading>

      <ArticleListContainer
        variables={{
          filter: { tags: article.tags.map(tag => tag.id) },
          take: 4,
        }}
        filter={articles =>
          articles.filter(a => a.id !== article.id).splice(0, 3)
        }
      />
    </Wrapper>
  );
};
