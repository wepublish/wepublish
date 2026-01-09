import { PageContainer } from '@wepublish/page/website';
import {
  getSessionTokenProps,
  ssrAuthLink,
  SubscribePage,
} from '@wepublish/utils/website';
import { getV1ApiClient, PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';
import getConfig from 'next/config';
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
  const { publicRuntimeConfig } = getConfig();
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
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
