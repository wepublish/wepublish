import styled from '@emotion/styled';
import { createFileRoute } from '@tanstack/react-router';
import { PageContainer } from '@wepublish/page/website';
import { MainSpacer } from '@wepublish/tenant/reflekt';
import {
  AuthorListPage,
  authorListRoute,
  loadPage,
  mergeApolloCache,
} from '@wepublish/utils/website/tanstack';

const TeamPageContent = styled(PageContainer)``;

const authors = authorListRoute({ canonicalUrl: '/team' });

/**
 * `pages/team/index.tsx` — the author list inside the CMS "team" page. Next
 * fetched the page on the client only; here it is loaded with the authors.
 */
export const Route = createFileRoute('/team/')({
  ...authors,
  loader: async ctx => {
    const [, page] = await Promise.all([
      authors.loader(ctx),
      loadPage({ data: { slug: 'team' } }),
    ]);

    mergeApolloCache(ctx.context.apolloClient, page.apollo);

    return { shell: page.shell };
  },
  component: Team,
});

function Team() {
  return (
    <TeamPageContent slug="team">
      <MainSpacer maxWidth="lg">
        <AuthorListPage canonicalUrl="/team" />
      </MainSpacer>
    </TeamPageContent>
  );
}
