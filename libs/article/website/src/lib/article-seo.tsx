import {
  isImageBlock,
  isRichTextBlock,
  isTitleBlock,
} from '@wepublish/block-content/website';
import { firstParagraphToPlaintext, toPlaintext } from '@wepublish/richtext';
import { Article, FullImageFragment } from '@wepublish/website/api';
import {
  BuilderArticleSEOProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Fragment, useMemo } from 'react';

export const getArticleSEO = (article: Article) => {
  const firstTitle = article.latest.blocks?.find(isTitleBlock);
  const firstRichText = article.latest.blocks?.find(isRichTextBlock);
  const firstImageBlock = article.latest.blocks?.find(isImageBlock);

  const articleBody = article.latest.blocks
    ?.filter(isRichTextBlock)
    .reduce((body, richText) => {
      const text = toPlaintext(richText.richText);

      if (text) {
        body.push(text);
      }

      return body;
    }, [] as string[])
    .join('\n');

  const socialMediaDescription =
    article.latest.socialMediaDescription ||
    article.latest.lead ||
    firstParagraphToPlaintext(firstRichText?.richText);
  const description =
    article.latest.lead || firstParagraphToPlaintext(firstRichText?.richText);

  const image = (article.latest.socialMediaImage ??
    article.latest.image ??
    firstImageBlock?.image) as FullImageFragment | undefined;
  const title =
    article.latest.seoTitle ||
    article.latest.title ||
    firstTitle?.title ||
    article.latest.socialMediaTitle;
  const socialMediaTitle =
    article.latest.socialMediaTitle ||
    article.latest.seoTitle ||
    article.latest.title ||
    firstTitle?.title;
  const headline = firstTitle?.title || article.latest.title;
  const url = article.latest.canonicalUrl ?? article.url;

  const firstAuthor = article.latest.authors.at(0);

  return {
    type: 'article',
    title,
    socialMediaTitle,
    description,
    socialMediaDescription,
    url,
    image,
    tags: article.tags,
    updatedAt: article.latest.publishedAt,
    publishedAt: article.publishedAt,
    authors: article.latest.authors ?? [],
    schema: {
      '@context': 'http://schema.org',
      '@type': 'NewsArticle',
      articleBody,
      keywords: article.tags.map(({ tag }) => tag).join(','),
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
      author: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        image:
          (firstAuthor?.image as FullImageFragment)?.s ??
          firstAuthor?.image?.url,
        jobTitle: firstAuthor?.jobTitle,
        name: firstAuthor?.name,
        url: firstAuthor?.url,
      },
      datePublished: article.publishedAt,
      name: title,
      headline,
      identifier: article.slug,
      url,
    },
  };
};

export const ArticleSEO = ({ article }: BuilderArticleSEOProps) => {
  const { meta, Head } = useWebsiteBuilder();
  const seo = useMemo(() => getArticleSEO(article), [article]);

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

      {seo.publishedAt && (
        <meta
          key={`og:article:published_time`}
          property="og:article:published_time"
          content={seo.publishedAt}
        />
      )}

      {seo.updatedAt && (
        <>
          <meta
            key={`og:article:modified_time`}
            property="og:article:modified_time"
            content={seo.updatedAt}
          />

          <meta
            key={`og:updated_time`}
            property="og:updated_time"
            content={seo.updatedAt}
          />
        </>
      )}

      {seo.authors.map(author => (
        <Fragment key={author.id}>
          <meta
            key={`author:${author.id}`}
            name="author"
            content={author.name}
          />

          <meta
            key={`og:article:author:username:${author.id}`}
            property="og:article:author:username"
            content={author.name}
          />
        </Fragment>
      ))}
      {seo.tags.map(tag => (
        <meta
          key={`og:article:tag:${tag.id}`}
          property="og:article:tag"
          content={tag.tag ?? ''}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.schema) }}
      />
    </Head>
  );
};
