import { createFileRoute } from '@tanstack/react-router';
import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import { DailyBriefingContext } from '@wepublish/utils/website/daily-briefing';
import {
  ApolloRouterContext,
  homePageRoute,
  loadDailyBriefing,
} from '@wepublish/utils/website/tanstack';
import { LinkContext } from '@wepublish/website/builder';

/** The mailchimp folder and count `getStaticProps` asked for. */
const BRIEFING = { count: 4, folderId: '496b1eb537' };

/** `pages/index.tsx` */
export const Route = createFileRoute('/')({
  ...homePageRoute(),
  loader: async (ctx: { context: ApolloRouterContext }) => {
    // The page and the briefing do not depend on each other.
    const [page, campaigns] = await Promise.all([
      homePageRoute().loader(ctx),
      loadDailyBriefing({ data: BRIEFING }),
    ]);

    return { ...page, campaigns };
  },
  component: Index,
});

function Index() {
  const { campaigns } = Route.useLoaderData();

  return (
    <LinkContext.Provider value={{ prefetch: true }}>
      <DailyBriefingContext.Provider value={campaigns}>
        <ContentWidthProvider fullWidth={false}>
          <PageContainer slug={''} />
        </ContentWidthProvider>
      </DailyBriefingContext.Provider>
    </LinkContext.Provider>
  );
}
