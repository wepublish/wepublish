import styled from '@emotion/styled';
import { createFileRoute } from '@tanstack/react-router';
import { PageContainer } from '@wepublish/page/website';
import { DailyBriefingContext } from '@wepublish/utils/website/daily-briefing';
import {
  ApolloRouterContext,
  homePageRoute,
  loadDailyBriefing,
} from '@wepublish/utils/website/tanstack';
import { LinkContext } from '@wepublish/website/builder';

/** The mailchimp folder and count `getStaticProps` asked for. */
const BRIEFING = { count: 5, folderId: '2faf509b27' };

const StyledPageWrapper = styled(PageContainer)(
  ({ theme }) => `
  ${theme.breakpoints.up('md')} {
    && > * {
      grid-column: 2/12;
    }
  }
`
);

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
        <StyledPageWrapper slug={''} />
      </DailyBriefingContext.Provider>
    </LinkContext.Provider>
  );
}
