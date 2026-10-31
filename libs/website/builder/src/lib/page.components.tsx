import { BuilderPageProps, BuilderPageSEOProps } from './page.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Page = (props: BuilderPageProps) => {
  const { Page } = useWebsiteBuilder();

  return <Page {...props} />;
};

export const PageSEO = (props: BuilderPageSEOProps) => {
  const { PageSEO } = useWebsiteBuilder();

  return <PageSEO {...props} />;
};
