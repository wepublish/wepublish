import { PageContainer } from '@wepublish/page/website';
import { EenewsPageShell } from '@wepublish/tenant/eenews';
import {
  getApiUrl,
  getSessionTokenProps,
  ssrAuthLink,
  SubscribePage,
} from '@wepublish/utils/website';
import { getApiClient, PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';

export default function Mitmachen() {
  return (
    <EenewsPageShell>
      <PageContainer slug="mitmachen" />
    </EenewsPageShell>
  );
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }

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
