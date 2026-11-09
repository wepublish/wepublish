import { createFileRoute } from '@tanstack/react-router';
import { homePageRoute } from '@wepublish/utils/website/tanstack';
import { LinkContext } from '@wepublish/website/builder';
import { PageContainer } from '@wepublish/page/website';

/** `pages/index.tsx` — the only tenant tweak is eager prefetching of links. */
export const Route = createFileRoute('/')({
  ...homePageRoute(),
  component: () => (
    <LinkContext.Provider value={{ prefetch: true }}>
      <PageContainer slug={''} />
    </LinkContext.Provider>
  ),
});
