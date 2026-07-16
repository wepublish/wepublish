import { PageContainer } from '@wepublish/page/website';
import { SubscribePage } from '@wepublish/utils/website';
import { PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';
import { ComponentProps } from 'react';

export default function Mitmachen(props: ComponentProps<typeof SubscribePage>) {
  return <PageContainer slug="mitmachen" />;
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
  return SubscribePage.getInitialProps(ctx, [
    {
      query: PageDocument,
      variables: { slug: 'mitmachen' },
    },
  ]);
};
