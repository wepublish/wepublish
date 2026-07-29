import mailchimp, {
  campaigns,
  ErrorResponse,
} from '@mailchimp/mailchimp_marketing';
import { captureException } from '@sentry/react';
import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  getApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { LinkContext } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import { ResponseError } from 'superagent';

import { DailyBriefingContext } from '../src/components/daily-briefing/daily-briefing-teaser';

type IndexProps = {
  campaigns: campaigns.Campaigns[];
};

export default function Index({ campaigns }: IndexProps) {
  return (
    <LinkContext.Provider value={{ prefetch: true }}>
      <DailyBriefingContext.Provider value={campaigns}>
        <ContentWidthProvider fullWidth={false}>
          <PageContainer slug={''} />
        </ContentWidthProvider>
      </DailyBriefingContext.Provider>
    </LinkContext.Provider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  if (!getApiUrl()) {
    return { props: {}, revalidate: 1 };
  }

  mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
  });

  const client = getApiClient(getApiUrl(), []);

  let mailchimpResponse:
    | mailchimp.campaigns.CampaignsSuccessResponse
    | ErrorResponse
    | null = null;
  try {
    mailchimpResponse = await mailchimp.campaigns.list({
      count: 4,
      sortField: 'send_time',
      status: 'sent',
      sortDir: 'DESC',
      folderId: '496b1eb537',
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

  await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug: '',
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const { campaigns = [] } =
    (mailchimpResponse as campaigns.CampaignsSuccessResponse) ?? {};

  const props = addClientCacheToProps(client, { campaigns });

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
