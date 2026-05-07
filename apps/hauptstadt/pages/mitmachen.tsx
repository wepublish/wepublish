import { PageContainer } from '@wepublish/page/website';
import {
  getApiUrl,
  getSessionTokenProps,
  ssrAuthLink,
  SubscribePage,
} from '@wepublish/utils/website';
import { getV1ApiClient, PageDocument } from '@wepublish/website/api';
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

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
  const client = getV1ApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug: 'mitmachen',
      },
    }),
  ]);

  return SubscribePage.getInitialProps(ctx);
};
