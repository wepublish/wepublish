import { PageContainer } from '@wepublish/page/website';
import {
  getSessionTokenProps,
  ssrAuthLink,
  SubscribePage,
} from '@wepublish/utils/website';
import { getV1ApiClient, PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';
import getConfig from 'next/config';
import { sortBy } from 'ramda';
import { ComponentProps } from 'react';

import { HauptstadtContentFullWidth } from '../src/components/hauptstadt-content-wrapper';

export const HAS_FORM_FIELDS = [
  'firstName',
  'address',
  'emailRepeated',
] satisfies ComponentProps<typeof SubscribePage>['fields'];

export const MitmachenInner = (props: ComponentProps<typeof SubscribePage>) => {
  return (
    <HauptstadtContentFullWidth>
      <SubscribePage
        {...props}
        sort={sortBy(memberPlan => {
          const tag = memberPlan.tags
            ?.find(tag => tag.startsWith('sort-order:'))
            ?.replace('sort-order:', '');

          return tag ? +tag : 0;
        })}
        fields={HAS_FORM_FIELDS}
      />
    </HauptstadtContentFullWidth>
  );
};
export default function Mitmachen(props: ComponentProps<typeof SubscribePage>) {
  return (
    <PageContainer slug="mitmachen">
      <MitmachenInner {...props} />
    </PageContainer>
  );
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
        slug: 'login',
      },
    }),
  ]);

  return SubscribePage.getInitialProps(ctx);
};
