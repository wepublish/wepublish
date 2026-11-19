import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { selectArticleAuthors } from '@wepublish/article/website';
import { useShare } from '@wepublish/ui';
import { FullArticleFragment } from '@wepublish/website/api';
import { Link } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import shareIcon from '../assets/share.svg';
import { staticImageSrc } from '../assets/static-image';
import { designText } from '../theme';

export const ArticleInfoRow = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)} 60px;
`;

export const ArticleByline = styled('p')`
  ${designText.text as CSSObject}
  margin: 0;

  a {
    color: inherit;
    text-decoration: underline;
  }
`;

export const ArticleShareButton = styled('button')`
  ${designText.textSmallMono as CSSObject}
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
`;

export const ArticleShareIcon = styled('img')`
  width: 27px;
  height: 27px;
`;

/**
 * Below the intro of an article: "von <authors>, <date>", the authors linked
 * to their page, and a button to share the article.
 */
export const ArticleInfo = ({
  article,
}: {
  article: Pick<FullArticleFragment, 'latest' | 'publishedAt' | 'url'>;
}) => {
  const { t } = useTranslation();
  const authors = selectArticleAuthors(article);
  const { share, shareMenu } = useShare({
    url: article.url,
    title: article.latest.title ?? undefined,
  });
  const date =
    article.publishedAt && format(new Date(article.publishedAt), 'dd.MM.yyyy');

  return (
    <ArticleInfoRow>
      {(authors.length > 0 || date) && (
        <ArticleByline>
          {authors.length > 0 && (
            <>
              {t('articleList.by')}{' '}
              {authors.map(({ author }, index) => (
                <Fragment key={author.id}>
                  {index > 0 && ', '}
                  {author.url ?
                    <Link href={author.url}>{author.name}</Link>
                  : author.name}
                </Fragment>
              ))}
              {date && ', '}
            </>
          )}
          {date && (
            <time
              dateTime={article.publishedAt ?? undefined}
              suppressHydrationWarning
            >
              {date}
            </time>
          )}
        </ArticleByline>
      )}

      <ArticleShareButton
        type="button"
        onClick={share}
      >
        <ArticleShareIcon
          src={staticImageSrc(shareIcon)}
          alt=""
        />
        {t('article.share')}
      </ArticleShareButton>

      {shareMenu}
    </ArticleInfoRow>
  );
};
