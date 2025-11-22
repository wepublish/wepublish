import styled from '@emotion/styled';
import { SliderWrapper } from '@wepublish/block-content/website';
import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import {
  addClientCacheToV1Props,
  CommentListDocument,
  CommentSort,
  getV1ApiClient,
  HotAndTrendingDocument,
  NavigationListDocument,
  PageDocument,
  PageQuery,
  PeerProfileDocument,
  SettingListDocument,
  SortOrder,
  TeaserListBlock,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';

import { BestOfWePublishWrapper } from '../src/components/best-of-wepublish/best-of-wepublish';
import { isFrageDesTages } from '../src/components/frage-des-tages/is-frage-des-tages';

const Homepage = styled(PageContainer)`
  grid-column: -1/1;
  gap: ${({ theme }) => theme.spacing(3)};

  ${BestOfWePublishWrapper} {
    padding-left: calc(100% / 24);
    padding-right: calc(100% / 24);
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    gap: ${({ theme }) => theme.spacing(6)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: ${({ theme }) => theme.spacing(5)};

    ${SliderWrapper} {
      padding-left: calc(100% / 12);
      padding-right: calc(100% / 12);
    }
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-column: 2/3;

    ${BestOfWePublishWrapper} {
      padding: 0;
    }
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    gap: ${({ theme }) => theme.spacing(10)};
  }
`;

export default function Index() {
  return (
    <ContentWidthProvider fullWidth>
      <Homepage slug={'home'} />
    </ContentWidthProvider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, []);

  const [page] = await Promise.all([
    client.query<PageQuery>({
      query: PageDocument,
      variables: {
        slug: 'home',
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
    client.query({
      query: SettingListDocument,
    }),
    client.query({
      query: HotAndTrendingDocument,
      variables: {
        take: 4,
      },
    }),
  ]);

  const fdTTeaser = page.data?.page?.latest.blocks.find(block => {
    return isFrageDesTages(block);
  }) as TeaserListBlock | undefined;

  if (fdTTeaser && fdTTeaser.teasers[0]) {
    let id: string | undefined;

    switch (fdTTeaser.teasers[0].__typename) {
      case 'ArticleTeaser': {
        id = fdTTeaser.teasers[0].article?.id;
        break;
      }
      case 'PageTeaser': {
        id = fdTTeaser.teasers[0].page?.id;
        break;
      }
    }

    if (id) {
      await client.query({
        query: CommentListDocument,
        variables: {
          sort: CommentSort.Rating,
          order: SortOrder.Descending,
          itemId: id,
        },
      });
    }
  }

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
