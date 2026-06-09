import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { Blocks } from '@wepublish/block-content/website';
import {
  FullBlockFragment,
  FullTeaserFragment,
  useArticleListQuery,
} from '@wepublish/website/api';
import {
  BuilderArticleProps,
  Image,
  Link,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { MdChevronLeft } from 'react-icons/md';

import { ArticlePropertiesContext } from './article-properties-context';
import { EenewsTeaser } from './blocks/eenews-teaser';

const Wrapper = styled('article')`
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 24px 64px;
  ${({ theme }) => theme.breakpoints.down('sm')} {
    padding: 28px 20px 48px;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 0;
  padding: 0;
  margin: 0 0 40px;
  color: ${({ theme }) => theme.palette.primary.main};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const Eyebrow = styled('div')`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const MetaSep = styled('span')`
  font-weight: 400;
  margin: 0 4px;
  opacity: 0.7;
`;

const TitleLine = styled(Typography)`
  display: block;
  margin: 0 0 28px;
  color: ${({ theme }) => theme.palette.primary.main};
  text-wrap: balance;
`;

const LeadTop = styled(Typography)`
  display: block;
  margin: 0 0 20px;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const Byline = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 0 0 28px;
  padding-bottom: 18px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

const BylineItem = styled('span')`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
`;

const BylineName = styled(Typography)`
  color: ${({ theme }) => theme.palette.primary.main};
`;

const BylineRole = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const HeroFigure = styled('figure')`
  margin: 0 0 28px;
  overflow: hidden;
  background: #e6ece9;
`;

const HeroImage = styled(Image)`
  width: 100%;
  height: auto;
  max-height: 480px;
  object-fit: cover;
`;

const BreakingFlag = styled('div')`
  display: inline-flex;
  margin-bottom: 16px;
`;

const BreakingBadge = styled(Typography)`
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 14px;
  background: #d6342f;
  color: ${({ theme }) => theme.palette.background.paper};
  border-radius: 3px;
`;

const Body = styled('div')`
  color: ${({ theme }) => theme.palette.text.primary};
`;

const ShareRow = styled('div')`
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
`;

const ShareLabel = styled(Typography)`
  color: ${({ theme }) => theme.palette.primary.main};
`;

const Likes = styled('div')`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const Related = styled('section')`
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 48px 56px 80px;
  ${({ theme }) => theme.breakpoints.down('sm')} {
    padding: 32px 20px 56px;
  }
`;

const RelatedTitle = styled(Typography)`
  display: block;
  margin: 0 0 28px;
  text-align: center;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const RelatedGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 36px 32px;
  ${({ theme }) => theme.breakpoints.down('lg')} {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  ${({ theme }) => theme.breakpoints.down('sm')} {
    grid-template-columns: 1fr;
  }
`;

const formatDateDE = (raw: string | Date | null | undefined): string => {
  if (!raw) {
    return '';
  }
  const d = typeof raw === 'string' ? new Date(raw) : raw;
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const EenewsArticle = ({
  data,
  showPaywall,
  hideContent,
  className,
  children,
}: BuilderArticleProps) => {
  const {
    blocks: { Teaser },
    CommentListItemShare,
  } = useWebsiteBuilder();

  const article = data?.article;
  const firstTagId = article?.tags?.[0]?.id;

  const { data: relatedData } = useArticleListQuery({
    skip: !firstTagId,
    variables: {
      filter: {
        tags: firstTagId ? [firstTagId] : undefined,
        excludeIds: article?.id ? [article.id] : undefined,
      },
      take: 3,
    },
  });

  if (!article) {
    return null;
  }

  const latest = article.latest;
  const dateStr = formatDateDE(article.publishedAt);
  const topicLabel = article.tags?.find(t => t.main)?.tag ?? undefined;
  const authors = (latest.authors ?? []).filter(a => !a.hideOnArticle);
  const hero = latest.image ?? undefined;
  const url = article.url ?? '';
  const title = latest.title ?? '';
  const properties = (latest.properties ?? []).map(p => ({
    key: p.key,
    value: p.value,
    public: true,
  }));
  const relatedTeasers = (relatedData?.articles?.nodes ?? []).slice(0, 3);

  return (
    <ArticlePropertiesContext.Provider value={properties}>
      <Wrapper className={className}>
        <BackLink href="/">
          <MdChevronLeft size={18} />
          <Typography variant="pageCrumb">Zurück zur Übersicht</Typography>
        </BackLink>

        {latest.breaking && (
          <BreakingFlag>
            <BreakingBadge variant="teaserBadge">Breaking</BreakingBadge>
          </BreakingFlag>
        )}

        <Eyebrow>
          {topicLabel && (
            <Typography variant="articleEyebrow">{topicLabel}</Typography>
          )}
          {topicLabel && dateStr && <MetaSep>|</MetaSep>}
          {dateStr && (
            <Typography variant="articleEyebrow">{dateStr}</Typography>
          )}
        </Eyebrow>

        <TitleLine variant="articleTitle">{title}</TitleLine>

        {latest.lead && (
          <LeadTop variant="articleLeadTop">{latest.lead}</LeadTop>
        )}

        {authors.length > 0 && (
          <Byline>
            {authors.map(author => (
              <BylineItem key={author.id}>
                <BylineName variant="teaserMeta">{author.name}</BylineName>
                {author.jobTitle && (
                  <BylineRole variant="articleCaption">
                    {author.jobTitle}
                  </BylineRole>
                )}
              </BylineItem>
            ))}
          </Byline>
        )}

        {hero && (
          <HeroFigure>
            <HeroImage
              image={hero}
              maxWidth={1200}
            />
          </HeroFigure>
        )}

        {!hideContent && (
          <Body>
            <Blocks
              blocks={latest.blocks as unknown as FullBlockFragment[]}
              type="Article"
            />
          </Body>
        )}

        {showPaywall && children}

        <ShareRow>
          <ShareLabel variant="pageEyebrow">Teilen</ShareLabel>
          <CommentListItemShare
            url={url}
            title={title}
          />
          <Likes title="Likes">
            <Typography variant="articleCaption">♥ {article.likes}</Typography>
          </Likes>
        </ShareRow>
      </Wrapper>

      {relatedTeasers.length > 0 && (
        <Related>
          <RelatedTitle variant="sectionTitle">
            Das könnte Sie auch interessieren
          </RelatedTitle>
          <RelatedGrid>
            <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
              {relatedTeasers.map((relatedArticle, idx) => (
                <Teaser
                  key={relatedArticle.id}
                  teaser={
                    {
                      __typename: 'ArticleTeaser',
                      style: 'DEFAULT',
                      image: null,
                      preTitle: null,
                      title: null,
                      lead: null,
                      article: relatedArticle,
                    } as unknown as FullTeaserFragment
                  }
                  index={idx}
                  blockStyle="RelatedGrid"
                  numColumns={3}
                  alignment={{
                    i: String(idx),
                    x: 0,
                    y: 0,
                    w: 4,
                    h: 1,
                  }}
                />
              ))}
            </WebsiteBuilderProvider>
          </RelatedGrid>
        </Related>
      )}
    </ArticlePropertiesContext.Provider>
  );
};
