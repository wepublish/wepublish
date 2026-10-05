import styled from '@emotion/styled';
import { useQuery } from '@apollo/client/react';
import { ArticleListContainer } from '@wepublish/article/website';
import { Blocks } from '@wepublish/block-content/website';
import { PageSEO } from '@wepublish/page/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleListDocument,
  ArticleSort,
  getApiClient,
  NavigationListDocument,
  PageDocument,
  PageQuery,
  PeerProfileDocument,
  SortOrder,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useMemo, useState } from 'react';

import {
  BkaMagazinFilter,
  BkaMagazinFilterValue,
  BkaSearchField,
  emptyBkaMagazinFilter,
} from '../src/components/filter/bka-magazin-filter';

const MAGAZIN_SLUG = 'magazin';

const ARTICLE_LIST_VARIABLES = {
  take: 25,
  skip: 0,
  sort: ArticleSort.PublishedAt,
  order: SortOrder.Descending,
};

export const MagazinGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: ${({ theme }) => theme.spacing(3)};
  row-gap: ${({ theme }) => theme.spacing(6)};
  align-items: start;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr 1fr;
  }
`;

export const MagazinColumn = styled('div')`
  display: contents;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    display: grid;
    align-content: start;
    gap: ${({ theme }) => theme.spacing(6)};
  }
`;

export const MagazinTitle = styled('div')`
  order: 1;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    order: 0;
  }
`;

export const MagazinMain = styled('div')`
  order: 3;
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(2.5)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    order: 0;
  }
`;

export const MagazinAside = styled('aside')`
  order: 2;
  display: grid;
  align-content: start;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    order: 0;
  }
`;

export default function MagazinPage() {
  const [filter, setFilter] = useState<BkaMagazinFilterValue>(
    emptyBkaMagazinFilter
  );

  const variables = useMemo(
    () => ({
      ...ARTICLE_LIST_VARIABLES,
      filter: {
        ...(filter.tags.length ? { tags: filter.tags } : {}),
        ...(filter.authors.length ? { authors: filter.authors } : {}),
        ...(filter.title ? { title: filter.title } : {}),
      },
    }),
    [filter]
  );

  const { data } = useQuery(PageDocument, {
    variables: { slug: MAGAZIN_SLUG },
  });

  const blocks = data?.page?.latest.blocks ?? [];
  const titleBlocks = blocks.filter(
    block => block?.__typename === 'TitleBlock'
  );
  const asideBlocks = blocks.filter(
    block => block?.__typename !== 'TitleBlock'
  );

  return (
    <>
      {data?.page && <PageSEO page={data.page} />}

      <BkaMagazinFilter
        value={filter}
        onChange={setFilter}
      />

      <MagazinGrid>
        <MagazinColumn>
          <MagazinTitle>
            <Blocks
              blocks={titleBlocks}
              type="Page"
            />
          </MagazinTitle>

          <MagazinMain>
            <BkaSearchField
              value={filter}
              onChange={setFilter}
            />

            <ArticleListContainer variables={variables} />
          </MagazinMain>
        </MagazinColumn>

        <MagazinAside>
          <Blocks
            blocks={asideBlocks}
            type="Page"
          />
        </MagazinAside>
      </MagazinGrid>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const client = getApiClient(getApiUrl(), []);

  const [page] = await Promise.all([
    client.query<PageQuery>({
      query: PageDocument,
      variables: { slug: MAGAZIN_SLUG },
    }),
    client.query({
      query: ArticleListDocument,
      variables: ARTICLE_LIST_VARIABLES,
    }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
  ]);

  return {
    props: addClientCacheToProps(client, {}),
    revalidate: !page.data?.page ? 1 : 60,
  };
};
