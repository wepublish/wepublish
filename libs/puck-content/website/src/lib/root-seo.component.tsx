import { Head, useWebsiteBuilder } from '@wepublish/website/builder';

import { RootMetadata } from '@wepublish/puck-content/editor';
import { resolveRootSEO } from './root-seo';

export type RootSEOProps = RootMetadata;

export const RootSEO = (props: RootSEOProps) => {
  const { meta } = useWebsiteBuilder();
  const { title, description, socialMediaTitle, socialMediaDescription } =
    resolveRootSEO(props);

  return (
    <Head>
      <title key="title">
        {title ? `${title} — ${meta.siteTitle}` : meta.siteTitle}
      </title>

      <meta
        key="og:type"
        property="og:type"
        content="website"
      />

      {props.hidden && (
        <meta
          key="robots"
          name="robots"
          content="noindex"
        />
      )}

      {description && (
        <meta
          key="description"
          name="description"
          content={description}
        />
      )}

      {socialMediaTitle && (
        <meta
          key="og:title"
          property="og:title"
          content={socialMediaTitle}
        />
      )}

      {socialMediaDescription && (
        <meta
          key="og:description"
          property="og:description"
          content={socialMediaDescription}
        />
      )}

      <meta
        key="twitter:card"
        name="twitter:card"
        content="summary_large_image"
      />
    </Head>
  );
};
