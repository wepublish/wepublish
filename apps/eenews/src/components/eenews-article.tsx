import styled from '@emotion/styled';
import { Box, Container, Typography } from '@mui/material';
import { ArticleListContainer } from '@wepublish/article/website';
import { BlockRenderer } from '@wepublish/block-content/website';
import { BuilderArticleProps, Image } from '@wepublish/website/builder';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { eenewsColors } from '../theme';
import { ArticlePropertiesContext } from './article-properties-context';

const HeroBorder = styled('div')`
  border-bottom: 1px solid ${eenewsColors.rule};
`;

const HeroInner = styled(Container)`
  padding-top: 40px;
  padding-bottom: 40px;
`;

const BackButton = styled('button')`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: ${eenewsColors.inkSoft};
  font-family: inherit;
  font-size: 13px;
  margin-bottom: 32px;
  padding: 0;
  &:hover {
    color: ${eenewsColors.ink};
  }
`;

const HeroGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: end;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const HeroLeft = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const HeroRight = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const ByLineRow = styled('div')`
  display: flex;
  gap: 24px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid ${eenewsColors.rule};
`;

const ByLineAvatar = styled('div')`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: ${eenewsColors.accent};
  color: ${eenewsColors.ink};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 16px;
`;

const ByLineMeta = styled('div')`
  border-left: 1px solid ${eenewsColors.rule};
  padding-left: 24px;
`;

const HeroImageWrap = styled('div')`
  aspect-ratio: 21 / 9;
  overflow: hidden;
  background: ${eenewsColors.paperWarm};
  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const BodyGrid = styled('div')`
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 40px;
  align-items: start;
  padding-bottom: 80px;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const ShareRail = styled('aside')`
  position: sticky;
  top: 140px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 4px;
  @media (max-width: 1100px) {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }
`;

const ShareItem = styled('button')`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: ${eenewsColors.ink};
  font-family: inherit;
  font-size: 13px;
  text-align: left;
`;

const ShareGlyph = styled('span')`
  font-size: 14px;
  color: ${eenewsColors.accentDeep};
  display: inline-flex;
  width: 18px;
  justify-content: center;
`;

const BodyColumn = styled('div')`
  max-width: 720px;
  width: 100%;
`;

const TagRow = styled('div')`
  margin-top: 48px;
  padding-top: 32px;
  border-top: 2px solid ${eenewsColors.ink};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const RelatedSection = styled('section')`
  background: ${eenewsColors.section};
`;

const initialOf = (name: string | undefined | null) => {
  if (!name) {
    return 'R';
  }
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : 'R';
};

const SHARE_ITEMS = [
  { label: 'Teilen', glyph: '↗' },
  { label: 'Speichern', glyph: '⌘' },
  { label: 'Drucken', glyph: '⎙' },
  { label: 'Hören', glyph: '▶' },
];

export const EenewsArticle = (props: BuilderArticleProps) => {
  const router = useRouter();
  const { data, className } = props;
  const article = data?.article;

  if (!article?.latest) {
    return null;
  }

  const latest = article.latest;
  const title = latest.title ?? '';
  const lead = latest.lead ?? '';
  const heroImage = latest.image;
  const author = latest.authors?.[0];
  const properties = latest.properties ?? [];
  const readTimeMin = properties.find(
    (p: { key: string; value: string }) => p.key === 'readTimeMin'
  )?.value;
  const publishedDateLabel =
    latest.publishedAt ?
      new Date(latest.publishedAt).toLocaleDateString('de-CH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const tags = article.tags ?? [];

  return (
    <ArticlePropertiesContext.Provider value={properties}>
      <article className={className}>
        <HeroBorder>
          <HeroInner>
            <BackButton
              onClick={() => router.back()}
              aria-label="Zurück"
            >
              <svg
                width="14"
                height="10"
                viewBox="0 0 14 10"
                fill="none"
              >
                <path
                  d="M13 5 H1 M5 1 L1 5 L5 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Zurück zur Übersicht
            </BackButton>
            <HeroGrid>
              <HeroLeft>
                <Typography
                  variant="metaEyebrow"
                  component="div"
                >
                  {tags[0]?.tag ?? 'Artikel'}
                  {publishedDateLabel ? ` · ${publishedDateLabel}` : ''}
                </Typography>
                <Typography
                  variant="displayArticleH1"
                  component="h1"
                  sx={{ margin: 0, color: eenewsColors.ink }}
                >
                  {title}
                </Typography>
              </HeroLeft>
              <HeroRight>
                {lead ?
                  <Typography
                    variant="bodyLead"
                    component="p"
                    sx={{ margin: 0, color: eenewsColors.ink }}
                  >
                    {lead}
                  </Typography>
                : null}
                <ByLineRow>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <ByLineAvatar>{initialOf(author?.name)}</ByLineAvatar>
                    <Box>
                      <Typography
                        variant="uiByLineName"
                        component="div"
                        sx={{ color: eenewsColors.ink }}
                      >
                        {author?.name ?? 'Redaktion ee·news'}
                      </Typography>
                      <Typography
                        variant="metaInline"
                        component="div"
                        sx={{ fontSize: 12, color: eenewsColors.inkSoft }}
                      >
                        {author?.jobTitle ?? 'Newsroom'}
                      </Typography>
                    </Box>
                  </Box>
                  {readTimeMin ?
                    <ByLineMeta>
                      <Typography
                        variant="metaEyebrow"
                        component="div"
                      >
                        Lesezeit
                      </Typography>
                      <Typography
                        variant="uiByLineName"
                        component="div"
                        sx={{ fontSize: 16 }}
                      >
                        {readTimeMin} Min.
                      </Typography>
                    </ByLineMeta>
                  : null}
                </ByLineRow>
              </HeroRight>
            </HeroGrid>
          </HeroInner>
        </HeroBorder>

        {heroImage ?
          <Container sx={{ paddingTop: 5, paddingBottom: 5 }}>
            <HeroImageWrap>
              <Image
                image={heroImage}
                maxWidth={1500}
              />
            </HeroImageWrap>
            <Typography
              variant="metaInline"
              component="div"
              sx={{
                marginTop: 1.5,
                fontStyle: 'italic',
                color: eenewsColors.inkSoft,
              }}
            >
              Bild: ee·news Archiv
            </Typography>
          </Container>
        : null}

        <Container>
          <BodyGrid>
            <ShareRail>
              <Typography
                variant="metaEyebrow"
                component="div"
                sx={{ marginBottom: 1 }}
              >
                Aktion
              </Typography>
              {SHARE_ITEMS.map(item => (
                <ShareItem
                  key={item.label}
                  type="button"
                >
                  <ShareGlyph>{item.glyph}</ShareGlyph>
                  {item.label}
                </ShareItem>
              ))}
            </ShareRail>

            <BodyColumn>
              {((latest.blocks ?? []) as Array<{ __typename?: string }>)
                // Skip the leading TitleBlock — its content is rendered as the
                // article hero (title / preTitle / lead) above.
                .filter(
                  (block, idx) =>
                    !(idx === 0 && block?.__typename === 'TitleBlock')
                )
                .map((block, index) => (
                  <BlockRenderer
                    key={index}
                    block={block as any}
                    index={index}
                    count={latest.blocks?.length ?? 0}
                    type={'Article' as any}
                  />
                ))}

              <TagRow>
                <Typography
                  variant="metaEyebrow"
                  component="div"
                >
                  Mehr zum Thema
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {tags.map((tag: { id: string; tag?: string | null }) => (
                    <Link
                      key={tag.id}
                      href={`/a/tag/${encodeURIComponent(tag.tag ?? '')}`}
                      style={{
                        padding: '6px 12px',
                        border: `1px solid ${eenewsColors.ruleStrong}`,
                        borderRadius: 999,
                        fontSize: 11,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: eenewsColors.inkSoft,
                        textDecoration: 'none',
                      }}
                    >
                      {tag.tag}
                    </Link>
                  ))}
                </Box>
              </TagRow>
            </BodyColumn>
          </BodyGrid>
        </Container>

        <RelatedSection>
          <Container sx={{ padding: '64px 32px' }}>
            <Typography
              variant="metaEyebrow"
              component="div"
              sx={{ marginBottom: 1 }}
            >
              Weiterlesen
            </Typography>
            <Typography
              variant="displaySection"
              component="h2"
              sx={{ margin: '0 0 32px', color: eenewsColors.ink }}
            >
              Verwandte Beiträge
            </Typography>
            <ArticleListContainer
              variables={{
                filter: { tags: tags.map((t: { id: string }) => t.id) },
                take: 4,
              }}
              filter={items =>
                items
                  .filter((a: { id: string }) => a.id !== article.id)
                  .slice(0, 3)
              }
            />
          </Container>
        </RelatedSection>
      </article>
    </ArticlePropertiesContext.Provider>
  );
};
