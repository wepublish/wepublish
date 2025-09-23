import {
  isImageBlock,
  isRichTextBlock,
  isTitleBlock,
} from '@wepublish/block-content/website';
import { firstParagraphToPlaintext } from '@wepublish/richtext';
import { FullImageFragment, Page } from '@wepublish/website/api';
import {
  BuilderPageSEOProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

export const getPageSEO = (page: Page) => {
  const firstTitle = page.latest.blocks?.find(isTitleBlock);
  const firstRichText = page.latest.blocks?.find(isRichTextBlock);
  const firstImageBlock = page.latest.blocks?.find(isImageBlock);

  const socialMediaDescription =
    page.latest.socialMediaDescription ||
    page.latest.description ||
    firstParagraphToPlaintext(firstRichText?.richText);
  const description =
    page.latest.socialMediaDescription ||
    page.latest.description ||
    firstParagraphToPlaintext(firstRichText?.richText);
  const image = (page.latest.socialMediaImage ??
    page.latest.image ??
    firstImageBlock?.image) as FullImageFragment | undefined;

  const title =
    page.latest.title || firstTitle?.title || page.latest.socialMediaTitle;
  const socialMediaTitle =
    page.latest.socialMediaTitle || page.latest.title || firstTitle?.title;
  const headline = firstTitle?.title || page.latest.title;
  const url = page.url;

  return {
    type: 'website',
    title,
    socialMediaTitle,
    description,
    socialMediaDescription,
    url,
    image,
    tags: page.tags,
    updatedAt: page.latest.publishedAt,
    publishedAt: page.publishedAt,
    schema: {
      '@context': 'http://schema.org',
      '@type': 'WebPage',
      keywords: page.tags.join(','),
      image:
        image ?
          {
            height: image.height,
            width: image.width,
            representativeOfPage: true,
            contentUrl: image.url,
            thumbnailUrl: image.m,
            url: image.url,
            encodingFormat: image.mimeType,
          }
        : undefined,
      description,
      datePublished: page.publishedAt,
      name: title,
      headline,
      identifier: page.slug,
      url,
    },
  };
};

export const PageSEO = ({ page }: BuilderPageSEOProps) => {
  const { meta, Head } = useWebsiteBuilder();
  const seo = useMemo(() => getPageSEO(page), [page]);

  const title = `${seo.title ? `${seo.title} —` : ``} ${meta.siteTitle}`;

  return (
    <Head>
      <title key="title">{title}</title>

      <meta
        key={'og:type'}
        property="og:type"
        content={seo.type}
      />

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

      {seo.updatedAt && (
        <meta
          key={`og:updated_time`}
          property="og:updated_time"
          content={seo.updatedAt}
        />
      )}

      {seo.image && (
        <>
          <meta
            key={'og:image:xl'}
            property="og:image"
            content={seo.image.xl ?? ''}
          />
          <meta
            key={'og:image:width:xl'}
            property="og:image:width"
            content="1200"
          />

          <meta
            key={'og:image:m'}
            property="og:image"
            content={seo.image.m ?? ''}
          />
          <meta
            key={'og:image:width:m'}
            property="og:image:width"
            content="800"
          />

          <meta
            key={'og:image:s'}
            property="og:image"
            content={seo.image.s ?? ''}
          />
          <meta
            key={'og:image:width:s'}
            property="og:image:width"
            content="500"
          />

          <meta
            key={'og:image:xs'}
            property="og:image"
            content={seo.image.xs ?? ''}
          />
          <meta
            key={'og:image:width:xs'}
            property="og:image:width"
            content="300"
          />

          <meta
            key={'og:image:xxs'}
            property="og:image"
            content={seo.image.xxs ?? ''}
          />
          <meta
            key={'og:image:width:xxs'}
            property="og:image:width"
            content="200"
          />

          <meta
            key={'og:image:l'}
            property="og:image"
            content={seo.image.l ?? ''}
          />
          <meta
            key={'og:image:width:l'}
            property="og:image:width"
            content="1000"
          />
        </>
      )}

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
