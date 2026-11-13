import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  FullAuthorFragment,
  SlimArticleFragment,
} from '@wepublish/website/api';
import { Image, Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import { designText } from '../../theme';
import {
  ArticleOverviewPagination,
  isInLanguage,
} from '../article-list/article-overview';
import { BlockHeader } from '../block-header';
import { tertiaryButton } from '../button-styles';
import {
  LatestNewsArticles,
  LatestNewsArticleTitle,
  LatestNewsText,
  NewsCard,
} from '../latest-news/latest-news';

export const articlesPerPage = 9;

export const AuthorPageWrapper = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(5)};

  // As much room below the navbar as a page that opens with a title block
  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 60px;
    padding-top: 60px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-top: 100px;
  }
`;

// The portrait on the left, the bio and the links on the right (361 and 752
// of the 1270px in the design)
export const AuthorProfile = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(4)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    &:has(> img) {
      grid-template-columns: minmax(0, 361fr) minmax(0, 752fr);
      align-items: start;
      gap: 30px;
    }
  }

  // Without a portrait only the column of the text
  ${({ theme }) => theme.breakpoints.up('md')} {
    width: calc(100% * 752 / 1270);

    &:has(> img) {
      width: calc(100% * 1143 / 1270);
    }
  }
`;

export const AuthorPortrait = styled(Image)`
  width: 100%;
  max-width: 361px;
  aspect-ratio: 361 / 486;
  object-fit: cover;
`;

export const AuthorAbout = styled('div')`
  display: grid;
  gap: 30px;
`;

export const AuthorBio = styled('div')`
  ${designText.text as CSSObject}
  hyphens: manual;

  p {
    ${designText.text as CSSObject}
    margin: 0;
  }

  p + p {
    margin-top: 1em;
  }
`;

export const AuthorLinkList = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;

export const AuthorLinkButton = styled(Link)`
  ${({ theme }) => tertiaryButton(theme)}
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const AuthorArticles = styled('section')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(5)};
  margin-top: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 60px;
    margin-top: 60px;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    margin-top: 120px;
  }
`;

// The titles of the articles a size larger than on the home page
export const AuthorArticle = styled(NewsCard)`
  ${LatestNewsText} {
    gap: 20px;
  }

  ${LatestNewsArticleTitle} {
    ${designText.h3 as CSSObject}
  }
`;

/**
 * The page of a person: the job title and the name, the portrait with the bio
 * and the links, below the articles of the person in the current language.
 */
export const WepAuthorPage = ({
  author,
  articles,
  page = 1,
  onPageChange,
}: {
  author: FullAuthorFragment;
  articles: SlimArticleFragment[];
  page?: number;
  onPageChange: (page: number) => void;
}) => {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const {
    blocks: { Title },
    elements: { Pagination },
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  const inLanguage = articles.filter(
    isInLanguage(locale !== 'default' ? locale : undefined)
  );
  const pageCount = Math.max(1, Math.ceil(inLanguage.length / articlesPerPage));
  const onPage = inLanguage.slice(
    (page - 1) * articlesPerPage,
    page * articlesPerPage
  );

  return (
    <AuthorPageWrapper>
      <Title
        __typename="TitleBlock"
        blockStyle={null}
        preTitle={author.jobTitle}
        title={author.name}
        lead={null}
      />

      <AuthorProfile>
        {author.image && (
          <AuthorPortrait
            image={author.image}
            fetchPriority="high"
          />
        )}

        <AuthorAbout>
          {author.bio && (
            <AuthorBio>
              <RenderRichtext document={author.bio} />
            </AuthorBio>
          )}

          {!!author.links?.length && (
            <AuthorLinkList>
              {author.links.map(({ title, url }) => (
                <AuthorLinkButton
                  key={url}
                  href={url}
                  target="_blank"
                >
                  {title}
                </AuthorLinkButton>
              ))}
            </AuthorLinkList>
          )}
        </AuthorAbout>
      </AuthorProfile>

      {onPage.length > 0 && (
        <AuthorArticles>
          <BlockHeader title={t('author.articlesBy', { name: author.name })} />

          <LatestNewsArticles>
            {onPage.map(article => (
              <AuthorArticle
                key={article.id}
                href={article.url}
                image={article.latest.image}
                title={article.latest.title}
                authors={
                  article.latest.hideAuthor ?
                    []
                  : article.latest.authors.map(({ author }) => author.name)
                }
                date={article.publishedAt}
              />
            ))}
          </LatestNewsArticles>

          {pageCount > 1 && (
            <ArticleOverviewPagination>
              <Pagination
                page={page}
                count={pageCount}
                onChange={(_, value) => onPageChange(value)}
              />
            </ArticleOverviewPagination>
          )}
        </AuthorArticles>
      )}
    </AuthorPageWrapper>
  );
};
