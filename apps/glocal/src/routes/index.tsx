import { createFileRoute } from '@tanstack/react-router';
import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import { homePageRoute } from '@wepublish/utils/website/tanstack';
import { LinkContext } from '@wepublish/website/builder';

/** `pages/index.tsx` — eager link prefetching, and the page spans the full
 * content width, as `pages/index.tsx` had it. */
export const Route = createFileRoute('/')({
  ...homePageRoute(),
  component: () => (
    <LinkContext.Provider value={{ prefetch: true }}>
      <ContentWidthProvider fullWidth>
        <PageContainer slug={''} />
      </ContentWidthProvider>
    </LinkContext.Provider>
  ),
});
