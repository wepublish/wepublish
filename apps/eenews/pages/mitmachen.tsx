import { PageContainer } from '@wepublish/page/website';
import { EenewsPageShell } from '@wepublish/tenant/eenews';
import { SubscribePage } from '@wepublish/utils/website/next';
import { NextPageContext } from 'next';

export default function Mitmachen() {
  return (
    <EenewsPageShell>
      <PageContainer slug="mitmachen" />
    </EenewsPageShell>
  );
}

Mitmachen.getInitialProps = (ctx: NextPageContext) =>
  SubscribePage.getInitialProps(ctx, { pageSlug: 'mitmachen' });
