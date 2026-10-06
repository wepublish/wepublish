import { createFileRoute } from '@tanstack/react-router';
import {
  SubscribePage,
  subscribeRouteLoader,
} from '@wepublish/utils/website/tanstack';
import { z } from 'zod';

/** `pages/mitmachen.tsx` — the member-plan filter is tenant specific. */
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
  loader: subscribeRouteLoader,
  component: Mitmachen,
  head: () => ({ meta: [{ title: 'Mitmachen | Gruppetto' }] }),
});

function Mitmachen() {
  const { tag } = Route.useSearch();

  return (
    <SubscribePage
      defaults={{ memberPlanSlug: 'gruppetto' }}
      filter={memberPlans =>
        memberPlans.filter(mb => {
          if (!tag) {
            return !mb.tags?.length;
          }

          return mb.tags?.includes(tag);
        })
      }
    />
  );
}
