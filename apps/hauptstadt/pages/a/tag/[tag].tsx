import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { TagTitleWrapper } from '@wepublish/tag/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleFilter,
  ArticleListDocument,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  TagDocument,
  TagListDocument,
  TagType,
  useArticleListQuery,
  useTagQuery,
} from '@wepublish/website/api';
import { Tag } from '@wepublish/website/builder';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { z } from 'zod';

import { TAG_ARCHIVIERT } from '../../../src/archiviert';

const take = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
});

type TagPageRule = {
  /** the tag page responds with a 404 */
  hidden?: boolean;
  /** articles carrying any of these tags are excluded */
  excludeTags?: string[];
  /** only articles carrying all of these tags (besides the page tag) are shown */
  requireTags?: string[];
};

const tagPageRules: Record<string, TagPageRule> = {
  kultur: { excludeTags: [TAG_ARCHIVIERT] },
  nachtleben: { requireTags: [TAG_ARCHIVIERT] },
  [TAG_ARCHIVIERT]: { hidden: true },
};

function HauptstadtTagPage({
  tag,
  articleFilter,
  className,
}: InferGetStaticPropsType<typeof getStaticProps> & { className?: string }) {
  const { query, replace } = useRouter();
  const { page } = pageSchema.parse(query);

  const variables = { take, skip: (page - 1) * take };

  const tagData = useTagQuery({
    variables: {
      tag,
      type: TagType.Article,
    },
  });

  const articles = useArticleListQuery({
    variables: {
      ...variables,
      filter: articleFilter,
    },
  });

  return (
    <Tag
      className={className}
      tag={tagData}
      articles={articles}
      variables={variables}
      onVariablesChange={variables => {
        replace(
          {
            query: {
              ...query,
              page: variables?.skip ? variables.skip / take + 1 : 1,
            },
          },
          undefined,
          { shallow: true, scroll: true }
        );
      }}
    />
  );
}

export default styled(HauptstadtTagPage)`
  ${TagTitleWrapper} {
    grid-column: -1/1;
    grid-template-columns: minmax(0, 680px);
    justify-content: center;
    margin-top: ${({ theme }) => theme.spacing(2)};
  }

  ${TagTitleWrapper} p {
    ${({ theme }) => css(theme.typography.subtitle1)}
  }
`;

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps = (async ({ params }) => {
  const { tag } = params || {};
  const client = getApiClient(getApiUrl(), []);

  const tagResult = await client.query({
    query: TagDocument,
    variables: {
      tag,
      type: TagType.Article,
    },
  });

  if (tagResult.error || !tagResult.data.tag) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  const pageTag = tagResult.data.tag;
  // match the rule against the canonical tag name, so URL case variants
  // like /a/tag/Kultur cannot bypass it
  const rule = tagPageRules[pageTag.tag?.toLowerCase() ?? ''];

  if (rule?.hidden) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }

  const ruleTagNames = [
    ...(rule?.excludeTags ?? []),
    ...(rule?.requireTags ?? []),
  ];
  const ruleTagIds: Record<string, string> = {};

  if (ruleTagNames.length) {
    const ruleTags = await client.query({
      query: TagListDocument,
      variables: {
        filter: { tags: ruleTagNames, type: TagType.Article },
      },
    });

    for (const node of ruleTags.data?.tags?.nodes ?? []) {
      if (node.tag) {
        ruleTagIds[node.tag.toLowerCase()] = node.id;
      }
    }
  }

  const resolveIds = (names?: string[]) =>
    (names ?? []).map(name => ruleTagIds[name]).filter(Boolean);

  const requireIds = resolveIds(rule?.requireTags);
  const excludeIds = resolveIds(rule?.excludeTags);

  const articleFilter: ArticleFilter = {
    ...(requireIds.length ?
      { tagsAll: [pageTag.id, ...requireIds] }
    : { tags: [pageTag.id] }),
    ...(excludeIds.length ? { tagsNotIn: excludeIds } : {}),
  };

  await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: {
        take,
        skip: 0,
        filter: articleFilter,
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const props = addClientCacheToProps(client, {
    tag: tag as string,
    articleFilter,
  });

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
}) satisfies GetStaticProps;
