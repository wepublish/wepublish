import { ApolloClient } from '@apollo/client';
import { PageContainer } from '@wepublish/page/website';
import { PageDocument, PageQuery } from '@wepublish/website/api';

export const FOUR_OH_FOUR_SLUG = '404';

/** TanStack port of `getFourOhFourStaticProps`. */
export const prefetchFourOhFour = (client: ApolloClient) =>
  client.query<PageQuery>({
    query: PageDocument,
    variables: { slug: FOUR_OH_FOUR_SLUG },
  });

/** TanStack port of `FourOhFourPage`. */
export const FourOhFourPage = () => <PageContainer slug={FOUR_OH_FOUR_SLUG} />;
