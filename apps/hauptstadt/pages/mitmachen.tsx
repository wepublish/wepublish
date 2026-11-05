import { PageContainer } from '@wepublish/page/website';
import { SubscribePage } from '@wepublish/utils/website/next';
import { NextPageContext } from 'next';
import { ComponentProps } from 'react';

export const HAS_FORM_FIELDS = [
  'firstName',
  'address',
  'emailRepeated',
] satisfies ComponentProps<typeof SubscribePage>['fields'];

export default function Mitmachen(props: ComponentProps<typeof SubscribePage>) {
  return <PageContainer slug="mitmachen" />;
}

Mitmachen.getInitialProps = (ctx: NextPageContext) =>
  SubscribePage.getInitialProps(ctx, { pageSlug: 'mitmachen' });
