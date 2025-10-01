import { BlockContent, Page as PageType } from '@wepublish/website/api';
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
      {data?.page && <PageSEO page={data.page as PageType} />}

      {data?.page && (
        <Blocks
          key={data.page.id}
          blocks={(data.page.latest.blocks as BlockContent[]) ?? []}
          type="Page"
        />
      )}

      {children}
    </OnlineReportsContentWrapper>
  );
}
