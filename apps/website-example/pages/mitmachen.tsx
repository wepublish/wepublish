import { PageContainer } from '@wepublish/page/website';
import { SubscribePage } from '@wepublish/utils/website/next';
import { NextPageContext } from 'next';
import { ComponentProps } from 'react';

export default function Mitmachen(props: ComponentProps<typeof SubscribePage>) {
  return <PageContainer slug="mitmachen" />;
}

Mitmachen.getInitialProps = (ctx: NextPageContext) =>
  SubscribePage.getInitialProps(ctx, { pageSlug: 'mitmachen' });
