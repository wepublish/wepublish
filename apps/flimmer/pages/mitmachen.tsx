import { PageContainer } from '@wepublish/page/website';
import { SubscribePage } from '@wepublish/utils/website/next';
import { NextPageContext } from 'next';

export default function Mitmachen() {
  return <PageContainer slug={'mitmachen'} />;
}

Mitmachen.getInitialProps = (ctx: NextPageContext) =>
  SubscribePage.getInitialProps(ctx, { pageSlug: 'mitmachen' });
