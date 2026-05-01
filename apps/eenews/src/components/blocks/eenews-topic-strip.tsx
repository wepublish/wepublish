import { useApolloClient } from '@apollo/client';
import styled from '@emotion/styled';
import { Container, Typography } from '@mui/material';
import {
  ArticleListDocument,
  TagListDocument,
  TagSort,
  TagType,
  useTagListQuery,
} from '@wepublish/website/api';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { eenewsColors } from '../../theme';
import { selectTopicCardColor } from '../teasers/eenews-teaser-selectors';

const Section = styled('section')`
  padding: 72px 0;
`;

const SectionHead = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 2px solid ${eenewsColors.ink};
  margin-bottom: 32px;
  @media (max-width: 800px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ActionLink = styled(Link)`
  color: ${eenewsColors.ink};
  text-decoration: none;
  white-space: nowrap;
  padding-bottom: 4px;
`;

const Strip = styled('div')`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  @media (max-width: 720px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Card = styled(Link, {
  shouldForwardProp: prop => prop !== 'borderColor',
})<{ borderColor: string }>`
  display: block;
  padding: 28px;
  background: ${eenewsColors.paperWarm};
  text-decoration: none;
  color: ${eenewsColors.ink};
  border-top: 3px solid ${({ borderColor }) => borderColor};
  transition: transform 0.25s ease;
  &:hover {
    transform: translateY(-3px);
  }
`;

const CardEyebrow = styled('div')`
  margin-top: 24px;
`;

type TopicWithCount = {
  id: string;
  tag?: string | null;
  url?: string | null;
  color?: string | null;
  count?: number;
};

/**
 * Topic strip — 4 paper-warm cards on the home page (Q21 resolved).
 *
 * Data source: `Query.tags(filter:{type:Article, main:true}, sort:Tag, take:4)`.
 * Per-tag count: `Query.articles(filter:{tags:[id]}, take:0).totalCount`.
 * Color: `Tag.color` with palette fallback (Q21b).
 *
 * CMS prerequisite: editors must mark up to 4 article-type tags as `main: true`,
 * optionally with a `Tag.color` set. Until tags are marked, the strip is empty.
 */
export const EenewsTopicStrip = () => {
  const { data: tagsData } = useTagListQuery({
    fetchPolicy: 'cache-and-network',
    variables: {
      filter: { type: TagType.Article },
      sort: TagSort.Tag,
      take: 50,
    },
  });

  const allTags = (tagsData?.tags?.nodes ?? []) as TopicWithCount[];
  // Prefer Tag.main-flagged tags (Q21a contract). When none are flagged, fall
  // back to the first 4 tags so the strip renders during the iteration loop.
  const mainTags = allTags.filter(
    t => (t as unknown as { main?: boolean }).main
  );
  const tags = (mainTags.length > 0 ? mainTags : allTags).slice(0, 4);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const client = useApolloClient();

  // Per-tag totalCount: the API has no `Tag.articlesCount` resolver, so we
  // issue parallel `articles(filter:{tags:[id]}, take:0)` queries and read
  // `totalCount`. Apollo de-duplicates against any pre-fetched home/welt cache
  // entries (via `getStaticProps`), and otherwise hits the network once per
  // tag on first render.
  useEffect(() => {
    if (!tags.length) {
      return;
    }
    let cancelled = false;
    Promise.all(
      tags.map(t =>
        client
          .query({
            query: ArticleListDocument,
            variables: { filter: { tags: [t.id] }, take: 0 },
            fetchPolicy: 'cache-first',
          })
          .then(res => [t.id, res.data?.articles?.totalCount ?? 0] as const)
          .catch(() => [t.id, 0] as const)
      )
    ).then(entries => {
      if (cancelled) {
        return;
      }
      setCounts(prev => {
        const next = { ...prev };
        for (const [id, count] of entries) {
          next[id] = count;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // tag id list is the only relevant input; we serialize for stable deps.
  }, [client, tags.map(t => t.id).join(',')]);

  const cards = useMemo(
    () =>
      tags.map((t, i) => ({
        ...t,
        count: counts[t.id] ?? 0,
        accent: selectTopicCardColor(t, i),
      })),
    [tags, counts]
  );

  if (!cards.length) {
    return null;
  }

  return (
    <Section>
      <Container>
        <SectionHead>
          <div>
            <Typography
              variant="metaEyebrow"
              component="div"
              sx={{ marginBottom: 1 }}
            >
              Themenfelder
            </Typography>
            <Typography
              variant="displaySection"
              component="h2"
              sx={{ margin: 0, color: eenewsColors.ink }}
            >
              Schwerpunkte
            </Typography>
          </div>
          <Typography
            variant="uiActionLink"
            component={ActionLink}
            href="/a"
          >
            Alle Themen →
          </Typography>
        </SectionHead>
        <Strip>
          {cards.map(card => (
            <Card
              key={card.id}
              href={`/a/tag/${encodeURIComponent(card.tag ?? '')}`}
              borderColor={card.accent}
            >
              <Typography
                variant="displayTopicCard"
                component="div"
                sx={{ margin: 0, color: eenewsColors.ink }}
              >
                {card.tag ?
                  card.tag.charAt(0).toUpperCase() + card.tag.slice(1)
                : '—'}
              </Typography>
              <CardEyebrow>
                <Typography
                  variant="metaEyebrow"
                  component="span"
                >
                  {card.count > 0 ?
                    `${card.count} ${card.count === 1 ? 'Beitrag' : 'Beiträge'} → `
                  : '→'}
                </Typography>
              </CardEyebrow>
            </Card>
          ))}
        </Strip>
      </Container>
    </Section>
  );
};

/**
 * GraphQL document references the page must pre-fetch in getStaticProps so the
 * cache is warm at render. Exported so the home/welt pages can call them
 * sequentially (one tag query + N article-count queries).
 */
export { ArticleListDocument, TagListDocument };
