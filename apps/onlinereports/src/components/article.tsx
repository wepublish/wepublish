import styled from '@emotion/styled';
import {
  ArticleListWrapper,
  ArticleTrackingPixels,
} from '@wepublish/article/website';
import { CommentListWrapper } from '@wepublish/comments/website';
import { Article as ArticleType, BlockContent } from '@wepublish/website/api';
import {
  BuilderArticleProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useEffect, useMemo } from 'react';

import { useAdsContext } from '../context/ads-context';
import { OnlineReportsContentWrapper } from './content-wrapper';

const articleAdsDisabledTags = [
  'Anzeige',
  'Publireportage',
  'Monatsgespräch',
  'Das Monatsgespräch',
  'NB',
  'No Banner',
];

export const ArticleWrapper = styled(OnlineReportsContentWrapper)`
  ${({ theme }) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
      grid-column: 2/12;
    }
  }
`;

export const ArticlePreTitle = styled('div')`
  margin-top: ${({ theme }) => theme.spacing(0.5)};
  margin-bottom: -${({ theme }) => theme.spacing(2.75)};
  color: ${({ theme }) => theme.palette.primary.main};
  grid-row-start: 1;
  font-weight: 500;
  line-height: 1.2;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    margin-top: ${({ theme }) => theme.spacing(4)};
    margin-bottom: -${({ theme }) => theme.spacing(3)};
  }
`;

export const ArticleTopMeta = styled('aside')`
  grid-row-start: 3;
`;
export const ArticleBottomMeta = styled('aside')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(5)};
  align-items: start;
`;

export function OnlineReportsArticle({
  className,
  data,
  children,
  loading,
  error,
}: BuilderArticleProps) {
  const {
    ArticleSEO,
    ArticleAuthors,
    ArticleMeta,
    blocks: { Blocks },
    elements: { H3, Button },
  } = useWebsiteBuilder();

  const { setAdsDisabled } = useAdsContext();

  const article = data?.article as ArticleType;

  const scrollToComments = () => {
    const el = document.getElementById('comments');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const adsDisabled = useMemo(
    () =>
      article?.tags?.some(
        ({ tag }) => tag && articleAdsDisabledTags.includes(tag)
      ) ?? false,
    [article]
  );

  useEffect(() => {
    setAdsDisabled(adsDisabled);
    return () => setAdsDisabled(false);
  }, [adsDisabled, setAdsDisabled]);

  return (
    <ArticleWrapper className={className}>
      {article && <ArticleSEO article={article} />}

      <Blocks
        key={article?.id}
        blocks={(article?.latest.blocks as BlockContent[]) ?? []}
        type="Article"
      />
      <ArticleTopMeta>
        {article && <ArticleAuthors article={article} />}
      </ArticleTopMeta>

      <ArticlePreTitle>{article?.latest.preTitle}</ArticlePreTitle>

      <ArticleBottomMeta>
        {article && <ArticleMeta article={article} />}
        {!article?.disableComments && (
          <>
            <H3>Ihre Meinung zu diesem Artikel</H3>
            <Button onClick={scrollToComments}>Kommentare</Button>
          </>
        )}
      </ArticleBottomMeta>

      {children}

      <ArticleTrackingPixels trackingPixels={article?.trackingPixels} />
    </ArticleWrapper>
  );
}
