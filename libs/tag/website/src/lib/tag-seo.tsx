import { toPlaintext } from '@wepublish/richtext';
import { Tag } from '@wepublish/website/api';
import {
  BuilderTagSEOProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

export const getTagSEO = (tag: Tag) => {
  const tagBody = toPlaintext(tag.description);
  const description = tagBody;

  const title = tag.tag;
  const url = tag.url;

  return {
    title,
    socialMediaTitle: title,
    description,
    socialMediaDescription: description,
    url,
    image: undefined,
    schema: {
      '@context': 'http://schema.org',
      '@type': 'WebPage',
      description,
      name: title,
      headline: title,
      identifier: tag.id,
      url,
    },
  };
};

export const TagSEO = ({ tag }: BuilderTagSEOProps) => {
  const { meta, Head } = useWebsiteBuilder();
  const seo = useMemo(() => getTagSEO(tag), [tag]);

  const title = `${seo.title ? `${seo.title} —` : ``} ${meta.siteTitle}`;

  return (
    <Head>
      <title key="title">{title}</title>
      {seo.socialMediaTitle && (
        <meta
          key={'og:title'}
          property="og:title"
          content={seo.socialMediaTitle}
        />
      )}
      {seo.socialMediaDescription && (
        <meta
          key={'og:description'}
          property="og:description"
          content={seo.socialMediaDescription}
        />
      )}
      {seo.description && (
        <meta
          key={'description'}
          name="description"
          content={seo.description}
        />
      )}
      <meta
        key={'og:url'}
        property="og:url"
        content={seo.url}
      />
      <link
        key={'canonical'}
        rel="canonical"
        href={seo.url}
      />
      <meta
        key={'twitter:card'}
        name="twitter:card"
        content="summary_large_image"
      />
      <meta
        key={'max-image-preview'}
        name="robots"
        content="max-image-preview:large"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.schema) }}
      />
    </Head>
  );
};
