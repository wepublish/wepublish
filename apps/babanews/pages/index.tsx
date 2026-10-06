import styled from '@emotion/styled';
import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import { revalidateFor, getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  getApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { LinkContext } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';

const Frontpage = styled(PageContainer)`
  padding-bottom: ${({ theme }) => theme.spacing(6)};
`;

export default function Index() {
  return (
    <LinkContext.Provider value={{ prefetch: true }}>
      <ContentWidthProvider fullWidth>
        <Frontpage slug={''} />
      </ContentWidthProvider>
    </LinkContext.Provider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  if (!getApiUrl()) {
    return { props: {}, revalidate: 1 };
  }

  const client = getApiClient(getApiUrl(), []);
  const [page] = await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug: '',
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: revalidateFor(page.data?.page, page.errors),
  };
};
