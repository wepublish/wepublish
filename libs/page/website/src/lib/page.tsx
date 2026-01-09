import styled from '@emotion/styled';
import { ContentWrapper } from '@wepublish/content/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderPageProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const PageWrapper = styled(ContentWrapper)``;

export function Page({
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
    <PageWrapper className={className}>
      {data?.page && <PageSEO page={data.page} />}

      {data?.page && (
        <Blocks
          key={data.page.id}
          blocks={(data.page.latest.blocks as BlockContent[]) ?? []}
          type="Page"
        />
      )}

      {children}
    </PageWrapper>
  );
}
