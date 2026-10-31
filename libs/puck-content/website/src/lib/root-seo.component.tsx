import { Head, useWebsiteBuilder } from '@wepublish/website/builder';

import {
  ArticleRootProps,
  DocumentRootProps,
} from '@wepublish/puck-content/editor';
import { PuckDocumentKind } from './document/document';
import { resolveRootSEO, rootOgTypes } from './root-seo';

export type RootSEOProps = DocumentRootProps &
  Pick<ArticleRootProps, 'canonicalUrl'> & {
    kind: PuckDocumentKind;
  };

export const RootSEO = ({ kind, canonicalUrl, ...props }: RootSEOProps) => {
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
        content={rootOgTypes[kind]}
      />

      {canonicalUrl && (
        <link
          key="canonical"
          rel="canonical"
          href={canonicalUrl}
        />
      )}

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
