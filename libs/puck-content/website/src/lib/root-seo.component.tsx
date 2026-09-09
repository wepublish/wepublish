import { useWebsiteBuilder } from '@wepublish/website/builder';

import { SEOValue } from '@wepublish/puck-content/editor';

export type RootSEOProps = {
  seo?: SEOValue;
  socialMedia?: SEOValue;
};

export const RootSEO = ({ seo, socialMedia }: RootSEOProps) => {
  const { meta, Head } = useWebsiteBuilder();

  const title = seo?.title || socialMedia?.title;
  const description = seo?.lead || socialMedia?.lead;
  const socialMediaTitle = socialMedia?.title || seo?.title;
  const socialMediaDescription = socialMedia?.lead || seo?.lead;

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
