import { PageContainer } from '@wepublish/page/website';
import {
  getApiUrl,
  getSessionTokenProps,
  ssrAuthLink,
  SubscribePage,
} from '@wepublish/utils/website';
import { getApiClient, PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';

import { EenewsPageShell } from '../src/components/eenews-page-shell';

export default function Mitmachen() {
  return (
    <EenewsPageShell>
      <PageContainer slug="mitmachen" />
    </EenewsPageShell>
  );
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
  const client = getApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await Promise.all([
    client.query({
      query: PageDocument,
      variables: { slug: 'mitmachen' },
    }),
  ]);

  return SubscribePage.getInitialProps(ctx);
};
