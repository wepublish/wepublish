import { ContentWrapper } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';

import MailchimpSubscribeForm from '../../src/components/newsletter/mailchimp-form';

type NewsletterPageProps = {
  mailchimpSignupUrl: string;
};

export default function NewsletterPage({
  mailchimpSignupUrl,
}: NewsletterPageProps) {
  const { query } = useRouter();
  const { firstname, lastname, email, source } = query;
  return (
    <>
      <PageContainer slug={'newsletter'} />

      <ContentWrapper>
        <MailchimpSubscribeForm
          signupUrl="https://ch-interkultur.us12.list-manage.com/subscribe/post?u=930fd0ccfcf8b34b60492e282&id=7755141349"
          defaultEmail={(email as string) || undefined}
          defaultFirstName={(firstname as string) || undefined}
          defaultLastName={(lastname as string) || undefined}
          source={(source as string) || undefined}
        />
      </ContentWrapper>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { publicRuntimeConfig } = getConfig();

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, []);
  await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug: 'newsletter',
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60,
  };
};
