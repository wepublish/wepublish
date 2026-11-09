import { createFileRoute } from '@tanstack/react-router';
import { PageContainer } from '@wepublish/page/website';
import { getPageShell } from '@wepublish/utils/website';
import { subscribeRouteLoader } from '@wepublish/utils/website/tanstack';
import { PageDocument, PageQuery } from '@wepublish/website/api';
import { z } from 'zod';

export const Route = createFileRoute('/mitmachen')({
  validateSearch: z.object({
    jwt: z.string().optional(),
    tag: z.string().optional(),
    memberPlanBySlug: z.string().optional(),
    additionalMemberPlans: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    mail: z.string().optional(),
    userId: z.string().optional(),
    discountCode: z.string().optional(),
    deactivateSubscriptionId: z.string().optional(),
    upgradeSubscriptionId: z.string().optional(),
  }),
  loaderDeps: ({ search: { jwt } }) => ({ jwt }),
  loader: async ctx => {
    const [page, subscribe] = await Promise.all([
      ctx.context.apolloClient.query<PageQuery>({
        query: PageDocument,
        variables: { slug: 'mitmachen' },
      }),
      subscribeRouteLoader(ctx),
    ]);

    return { ...subscribe, shell: getPageShell(page.data?.page) };
  },
  component: Mitmachen,
});

function Mitmachen() {
  return <PageContainer slug="mitmachen" />;
}
