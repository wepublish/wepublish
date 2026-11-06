import { createFileRoute } from '@tanstack/react-router';
import { ContentWrapper } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import {
  ApolloRouterContext,
  loadPage,
  mergeApolloCache,
  useQueryParams,
} from '@wepublish/utils/website/tanstack';

import MailchimpSubscribeForm from '../../components/newsletter/mailchimp-form';

const NEWSLETTER_SLUG = 'newsletter';

/**
 * The Mailchimp audience this form posts to. It was inline in
 * `pages/newsletter/index.tsx` and is kept verbatim.
 */
const SIGNUP_URL =
  'https://ch-interkultur.us12.list-manage.com/subscribe/post?u=930fd0ccfcf8b34b60492e282&id=7755141349';

/** `pages/newsletter/index.tsx` */
export const Route = createFileRoute('/newsletter/')({
  loader: async ({
    context: { apolloClient },
  }: {
    context: ApolloRouterContext;
  }) => {
    const { apollo, shell } = await loadPage({
      data: { slug: NEWSLETTER_SLUG },
    });

    mergeApolloCache(apolloClient, apollo);

    return { shell };
  },
  component: NewsletterPage,
});

function NewsletterPage() {
  // `useRouter().query` in Next; the merged params/search object here.
  const { firstname, lastname, email, source } = useQueryParams();

  return (
    <>
      <PageContainer slug={NEWSLETTER_SLUG} />

      <ContentWrapper>
        <MailchimpSubscribeForm
          key={`${email ?? ''}|${firstname ?? ''}|${lastname ?? ''}`}
          signupUrl={SIGNUP_URL}
          defaultEmail={(email as string) || undefined}
          defaultFirstName={(firstname as string) || undefined}
          defaultLastName={(lastname as string) || undefined}
          source={(source as string) || undefined}
        />
      </ContentWrapper>
    </>
  );
}
