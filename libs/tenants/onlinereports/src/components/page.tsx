import { ContentUnavailable } from '@wepublish/content/website';
import {
  BuilderPageProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { OnlineReportsContentWrapper } from './content-wrapper';

export function OnlineReportsPage({
  className,
  data,
  loading,
  error,
  children,
}: BuilderPageProps) {
  const {
    PageSEO,
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <OnlineReportsContentWrapper className={className}>
      {!data?.page && !loading && <ContentUnavailable />}
      {data?.page && <PageSEO page={data.page} />}

      {data?.page && (
        <Blocks
          key={data.page.id}
          blocks={data.page.latest.blocks ?? []}
          type="Page"
        />
      )}

      {children}
    </OnlineReportsContentWrapper>
  );
}
