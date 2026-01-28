import mailchimp, { campaigns } from '@mailchimp/mailchimp_marketing';
import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';

import { DailyBriefingContext } from '../src/components/teasers/teaser-sidebar-daily-briefing-context';

type IndexProps = {
  campaigns: campaigns.Campaigns[];
};

export default function Index({ campaigns }: IndexProps) {
  return (
    <DailyBriefingContext.Provider value={campaigns}>
      <ContentWidthProvider fullWidth={true}>
        <PageContainer slug={''} />
      </ContentWidthProvider>
    </DailyBriefingContext.Provider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig, serverRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  mailchimp.setConfig({
    apiKey: serverRuntimeConfig.env.MAILCHIMP_API_KEY,
    server: serverRuntimeConfig.env.MAILCHIMP_SERVER_PREFIX,
  });

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, []);
  const [mailchimpResponse] = await Promise.all([
    mailchimp.campaigns.list({
      count: 4,
      sortField: 'send_time',
      status: 'sent',
      sortDir: 'DESC',
      folderId: '90c02813e1',
      fields: [
        'campaigns.id',
        'campaigns.long_archive_url',
        'campaigns.settings.subject_line',
      ],
    }),
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

  const { campaigns } = mailchimpResponse as campaigns.CampaignsSuccessResponse;

  const props = addClientCacheToV1Props(client, { campaigns });

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
