import {
  PollBlockProvider,
  SubscribeBlockProvider,
} from '@wepublish/block-content/website';
import { BannerDocumentType, usePageQuery } from '@wepublish/website/api';
import {
  BuilderContainerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { BannerContainer } from '@wepublish/banner/website';
import { PropsWithChildren } from 'react';

type IdOrSlug = { id: string; slug?: never } | { id?: never; slug: string };

export type PageContainerProps = PropsWithChildren<
  IdOrSlug & BuilderContainerProps
>;

export function PageContainer({
  id,
  slug,
  className,
  children,
}: PageContainerProps) {
  const { Page } = useWebsiteBuilder();
  const { data, loading, error } = usePageQuery({
    variables: {
      id,
      slug,
    },
  });

  return (
    <PollBlockProvider>
      <SubscribeBlockProvider>
        <BannerContainer
          documentId={data?.page?.id}
          documentType={BannerDocumentType.Page}
        />

        <Page
          data={data}
          loading={loading}
          error={error}
          className={className}
        >
          {children}
        </Page>
      </SubscribeBlockProvider>
    </PollBlockProvider>
  );
}
