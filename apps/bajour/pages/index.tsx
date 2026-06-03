import styled from '@emotion/styled';
import mailchimp, {
  campaigns,
  ErrorResponse,
} from '@mailchimp/mailchimp_marketing';
import { captureException } from '@sentry/react';
import { SliderWrapper } from '@wepublish/block-content/website';
import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  CommentListDocument,
  CommentSort,
  getApiClient,
  HotAndTrendingDocument,
  NavigationListDocument,
  PageDocument,
  PageQuery,
  PeerProfileDocument,
  SettingListDocument,
  SortOrder,
  TeaserListBlock,
} from '@wepublish/website/api';
import { LinkContext } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { ResponseError } from 'superagent';

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
    <LinkContext.Provider value={{ prefetch: true }}>
      <ContentWidthProvider fullWidth>
        <Homepage slug={'home'} />
      </ContentWidthProvider>
    </LinkContext.Provider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig, serverRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  let mailchimpResponse:
    | mailchimp.campaigns.CampaignsSuccessResponse
    | ErrorResponse
    | null = null;
  try {
    mailchimp.setConfig({
      apiKey: serverRuntimeConfig.env.MAILCHIMP_API_KEY,
      server: serverRuntimeConfig.env.MAILCHIMP_SERVER_PREFIX,
    });

    mailchimpResponse = await mailchimp.campaigns.list({
      count: 4,
      sortField: 'send_time',
      status: 'sent',
      sortDir: 'DESC',
      folderId: '25685',
      fields: [
        'campaigns.id',
        'campaigns.long_archive_url',
        'campaigns.settings.subject_line',
      ],
    });
  } catch (e) {
    if (e && typeof e === 'object' && 'response' in e) {
      console.error((e as ResponseError).response?.body);
    }

    captureException(e);
  }

  const client = getApiClient(getApiUrl(), []);

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

  const { campaigns = [] } =
    (mailchimpResponse as campaigns.CampaignsSuccessResponse) ?? {};

  const props = addClientCacheToProps(client, { campaigns });

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
