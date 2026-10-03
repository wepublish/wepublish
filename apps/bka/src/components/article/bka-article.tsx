import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { ArticleListContainer } from '@wepublish/article/website';
import { isTitleBlock } from '@wepublish/block-content/website';
import {
  ArticleSEO,
  Blocks,
  BuilderArticleProps,
  Image,
} from '@wepublish/website/builder';
import { format } from 'date-fns';
import { MdAccessTime, MdMarkunreadMailbox } from 'react-icons/md';

import { displayFontFamily } from '../../theme';
import { BkaArticleAuthor } from '../author/bka-article-author';
import { BkaCtaBox } from '../cta/bka-cta-box';
import { BkaTag, BkaTagList } from '../tag/bka-tag';
import { readingTimeInMinutes } from './bka-reading-time';

const formatReadingTime = (minutes: number) =>
  `${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'} Lesedauer`;

export const BkaArticleWrapper = styled('article')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: ${({ theme }) => theme.spacing(5)};
`;

export const BkaArticleSectionTitle = styled('h2')`
  margin: 0 0 ${({ theme }) => theme.spacing(5)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
  border-bottom: 1.5px solid ${({ theme }) => theme.palette.text.primary};
  ${({ theme }) => css(theme.typography.h5)}
`;

export const BkaArticleAuthorGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 170px 1fr 60%;
    gap: 0;
  }
`;

export const BkaArticleAuthorColumn = styled('div')`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-column: 1 / 3;
    padding-right: ${({ theme }) => theme.spacing(5)};
  }
`;

export const BkaArticleAuthorArticles = styled('div')`
  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-column: 3 / 4;
  }
`;

export const BkaArticleGrid = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: ${({ theme }) => theme.spacing(5)};
  margin-top: -${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 170px 1fr 60%;
    grid-template-rows: 365px repeat(2, 45px) 1fr;
    gap: 0;
  }
`;

const readingTimeGradient = `
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    z-index: -1;
    width: 175px;
    height: 100%;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.55) 0px, transparent);
  }
`;

export const BkaArticleBannerReadingTime = styled('div')`
  position: absolute;
  isolation: isolate;
  left: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  height: 45px;
  padding: 0 ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.palette.common.white};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  line-height: ${({ theme }) => theme.typography.body1.lineHeight};

  ${readingTimeGradient}

  ${({ theme }) => theme.breakpoints.up('lg')} {
    display: none;
  }
`;

export const BkaArticleReadingTime = styled('div')`
  display: none;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    position: relative;
    isolation: isolate;
    grid-area: 3 / 3 / 4 / 4;
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1)};
    padding: 0 ${({ theme }) => theme.spacing(5)};
    color: ${({ theme }) => theme.palette.common.white};
    font-size: ${({ theme }) => theme.typography.body1.fontSize};
    line-height: ${({ theme }) => theme.typography.body1.lineHeight};

    ${readingTimeGradient}
  }
`;

export const BkaArticleBanner = styled('div')`
  position: relative;
  overflow: hidden;
  height: 162px;
  margin-inline: -${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-area: 1 / 2 / 4 / 4;
    height: auto;
    margin-inline: 0;
  }
`;

export const BkaArticleBannerImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const BkaArticleHeadline = styled('div')`
  position: relative;
  z-index: 5;
  background-color: ${({ theme }) => theme.palette.background.default};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-area: 3 / 1 / 5 / 3;
    padding: ${({ theme }) => theme.spacing(5)}
      ${({ theme }) => theme.spacing(5)} 0 0;
  }
`;

export const BkaArticleTitle = styled('h1')`
  margin: 0 0 ${({ theme }) => theme.spacing(3)};
  font-family: ${displayFontFamily};
  font-size: calc(1.4442rem + 1.4173vw);
  font-weight: 400;
  line-height: ${({ theme }) => theme.typography.h1.lineHeight};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    font-size: 2.625rem;
  }
`;

export const BkaArticleTags = styled(BkaTagList)`
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  font-size: 0.75rem;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    font-size: ${({ theme }) => theme.typography.body1.fontSize};
  }
`;

export const BkaArticlePublished = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1)} 0;
  border-top: 1.5px solid ${({ theme }) => theme.palette.grey[100]};
  border-bottom: 1.5px solid ${({ theme }) => theme.palette.grey[100]};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  font-weight: 400;
  line-height: ${({ theme }) => theme.typography.body1.lineHeight};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    font-size: 1.545rem;
  }
`;

export const BkaArticleAuthors = styled('div')`
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  font-weight: 400;
  line-height: ${({ theme }) => theme.typography.body1.lineHeight};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    font-size: 1.545rem;
  }
`;

export const BkaArticleContent = styled('div')`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(7.5)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-area: 4 / 3 / 5 / 4;
    padding-top: ${({ theme }) => theme.spacing(7.5)};
    padding-left: ${({ theme }) => theme.spacing(5)};
    padding-right: ${({ theme }) => theme.spacing(11.5)};
  }

  p {
    hyphens: manual;
    word-break: normal;
    overflow-wrap: normal;
  }

  & > *:first-of-type p:first-of-type::first-letter {
    font-size: 2.75em;
    line-height: 1;
    margin-right: 0.125em;
  }
`;

export const BkaArticle = ({
  className,
  data,
  children,
  loading,
}: BuilderArticleProps) => {
  const article = data?.article;

  if (!article) {
    return loading ? null : <>{children}</>;
  }

  const { title, publishedAt, image, authors } = article.latest;
  const contentBlocks = (article.latest.blocks ?? []).filter(
    block => !isTitleBlock(block)
  );

  const authorIds = (authors ?? []).map(({ author }) => author.id);

  return (
    <BkaArticleWrapper className={className}>
      <ArticleSEO article={article} />

      <BkaArticleGrid>
        {image && (
          <BkaArticleBanner>
            <BkaArticleBannerImage
              image={image}
              loading="eager"
              fetchPriority="high"
            />

            <BkaArticleBannerReadingTime>
              <MdAccessTime
                size={16}
                aria-hidden
              />
              {formatReadingTime(
                readingTimeInMinutes(article.latest.blocks ?? [])
              )}
            </BkaArticleBannerReadingTime>
          </BkaArticleBanner>
        )}

        <BkaArticleReadingTime>
          <MdAccessTime
            size={16}
            aria-hidden
          />
          {formatReadingTime(readingTimeInMinutes(article.latest.blocks ?? []))}
        </BkaArticleReadingTime>

        <BkaArticleHeadline>
          <BkaArticleTitle>{title}</BkaArticleTitle>

          {!!article.tags?.length && (
            <BkaArticleTags>
              {article.tags.map(tag => (
                <BkaTag
                  key={tag.id}
                  tag={tag}
                />
              ))}
            </BkaArticleTags>
          )}

          {publishedAt && (
            <BkaArticlePublished>
              {`Veröffentlicht am ${format(new Date(publishedAt), 'dd.MM.yyyy')}`}
            </BkaArticlePublished>
          )}

          {!!authors?.length && (
            <BkaArticleAuthors>
              {authors.map(({ author }) => author.name.trim()).join(', ')}
            </BkaArticleAuthors>
          )}
        </BkaArticleHeadline>

        <BkaArticleContent>
          <Blocks
            key={article.id}
            blocks={contentBlocks}
            type="Article"
          />

          {children}
        </BkaArticleContent>
      </BkaArticleGrid>

      {!!authors?.length && (
        <section>
          <BkaArticleSectionTitle>
            Artikel des/derselben Autor:in
          </BkaArticleSectionTitle>

          <BkaArticleAuthorGrid>
            <BkaArticleAuthorColumn>
              {authors.map(({ author }) => (
                <BkaArticleAuthor
                  key={author.id}
                  author={author}
                />
              ))}

              <BkaCtaBox
                title="BKa abonnieren"
                icon={
                  <MdMarkunreadMailbox
                    size={26}
                    aria-hidden
                  />
                }
                actionLabel="Jetzt abonnieren"
                actionHref="/mitmachen"
              >
                <p>
                  Dieser und unzählige weitere Artikel sind auch in gedruckter
                  Form erhältlich. Die Berner Kulturagenda erscheint
                  zweiwöchentlich und beleuchtet das Berner Kulturgeschehen.
                </p>
              </BkaCtaBox>
            </BkaArticleAuthorColumn>

            <BkaArticleAuthorArticles>
              <ArticleListContainer
                variables={{
                  take: 10,
                  filter: { authors: authorIds },
                }}
              />
            </BkaArticleAuthorArticles>
          </BkaArticleAuthorGrid>
        </section>
      )}
    </BkaArticleWrapper>
  );
};
