import { createFileRoute } from '@tanstack/react-router';
import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import { homePageRoute } from '@wepublish/utils/website/tanstack';
import { LinkContext } from '@wepublish/website/builder';

/**
 * `pages/index.tsx` — the home page prefetches its links eagerly and runs
 * full width.
 */
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
