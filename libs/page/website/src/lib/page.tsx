import styled from '@emotion/styled';
import { css, GlobalStyles } from '@mui/material';
import {
  ContentWrapper,
  PreviewStatusBanner,
  ContentUnavailable,
} from '@wepublish/content/website';
import {
  BuilderPageProps,
  footerContainerClassName,
  navbarContainerClassName,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const PageWrapper = styled(ContentWrapper)``;

const hideHeaderFooter = (
  <GlobalStyles
    styles={css`
      .${navbarContainerClassName}, .${footerContainerClassName} {
        display: none !important;
      }
    `}
  />
);

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

      {data?.page && <PageSEO page={data.page} />}
      {data?.page?.hideHeaderFooter && hideHeaderFooter}

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
