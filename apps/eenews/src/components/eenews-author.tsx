import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { Teaser, useArticleListQuery } from '@wepublish/website/api';
import {
  BuilderAuthorProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

import { eenewsColors } from '../theme';
import { EenewsTeaser } from './blocks/eenews-teaser';

const Hero = styled('section')`
  padding: 64px 56px 48px;
  background: ${eenewsColors.bg};
  border-bottom: 1px solid ${eenewsColors.line};
  ${({ theme }) => theme.breakpoints.down('sm')} {
    padding: 32px 20px 24px;
  }
`;

const HeroInner = styled('div')`
  max-width: 1340px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 40px;
  align-items: start;
  ${({ theme }) => theme.breakpoints.down('sm')} {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const AvatarLarge = styled('div')`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: ${eenewsColors.tag};
  display: grid;
  place-items: center;
  color: ${eenewsColors.accent};
  ${({ theme }) => theme.breakpoints.down('sm')} {
    width: 96px;
    height: 96px;
  }
`;

const AvatarInitials = styled(Typography)`
  display: block;
`;

const Name = styled(Typography)`
  display: block;
  margin: 0 0 8px;
  color: ${eenewsColors.accent};
`;

const Role = styled(Typography)`
  display: block;
  color: ${eenewsColors.accent};
  opacity: 0.7;
  margin-bottom: 16px;
`;

const Bio = styled(Typography)`
  display: block;
  color: ${eenewsColors.text};
  max-width: 64ch;
  margin: 0;
`;

const ArticlesSection = styled('section')`
  padding: 56px;
  background: ${eenewsColors.bg};
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 36px 20px;
  }
`;

const Grid = styled('div')`
  max-width: 1340px;
  margin: 0 auto;
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

const bioToText = (bio: unknown): string => {
  if (!Array.isArray(bio)) {
    return '';
  }
  return bio
    .map(node => {
      if (typeof node !== 'object' || node === null) {
        return '';
      }
      const children = (node as { children?: Array<{ text?: string }> })
        .children;
      if (!Array.isArray(children)) {
        return '';
      }
      return children.map(c => c.text ?? '').join('');
    })
    .join(' ')
    .trim();
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

export const EenewsAuthor = ({ data, className }: BuilderAuthorProps) => {
  const {
    blocks: { Teaser: BuilderTeaser },
  } = useWebsiteBuilder();

  const author = data?.author;
  const { data: articlesData } = useArticleListQuery({
    skip: !author?.id,
    variables: {
      filter: { authors: author?.id ? [author.id] : undefined },
      take: 12,
    },
  });

  if (!author) {
    return null;
  }

  const articles = articlesData?.articles?.nodes ?? [];

  return (
    <div className={className}>
      <Hero>
        <HeroInner>
          <AvatarLarge>
            <AvatarInitials variant="pageH1Standard">
              {initials(author.name)}
            </AvatarInitials>
          </AvatarLarge>
          <div>
            <Typography variant="pageEyebrow">Autor:in</Typography>
            <Name variant="pageH1Standard">{author.name}</Name>
            {author.jobTitle && (
              <Role variant="topbarLink">{author.jobTitle}</Role>
            )}
            <Bio variant="pageLead">{bioToText(author.bio)}</Bio>
          </div>
        </HeroInner>
      </Hero>

      {articles.length > 0 && (
        <ArticlesSection>
          <Grid>
            <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
              {articles.map((relatedArticle, idx) => (
                <BuilderTeaser
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
                    } as unknown as Teaser
                  }
                  index={idx}
                  blockStyle="DossierGrid"
                  numColumns={3}
                  alignment={{
                    i: String(idx),
                    x: 0,
                    y: 0,
                    w: 4,
                    h: 1,
                    static: false,
                  }}
                />
              ))}
            </WebsiteBuilderProvider>
          </Grid>
        </ArticlesSection>
      )}
    </div>
  );
};
