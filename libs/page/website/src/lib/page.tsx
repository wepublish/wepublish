import styled from '@emotion/styled';
import {
  ContentWrapper,
  PreviewStatusBanner,
  ContentUnavailable,
} from '@wepublish/content/website';
import { Page as PageType } from '@wepublish/website/api';
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
      {!data?.page && !loading && <ContentUnavailable />}
      {data?.page && <PreviewStatusBanner />}

      {data?.page && <PageSEO page={data.page as PageType} />}

      {data?.page && (
        <Blocks
          key={data.page.id}
          blocks={data.page.latest.blocks ?? []}
          type="Page"
        />
      )}

      {children}
    </PageWrapper>
  );
}
