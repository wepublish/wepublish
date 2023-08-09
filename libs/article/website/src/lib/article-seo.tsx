import {isImageBlock, isRichTextBlock, isTitleBlock} from '@wepublish/block-content/website'
import {firstParagraphToPlaintext, toPlaintext} from '@wepublish/richtext'
import {Article, FullImageFragment} from '@wepublish/website/api'
import {BuilderArticleSEOProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Fragment, useMemo} from 'react'

export const getArticleSEO = (article: Article) => {
  const firstTitle = article.blocks.find(isTitleBlock)
  const firstRichText = article.blocks.find(isRichTextBlock)
  const firstImageBlock = article.blocks.find(isImageBlock)

  const articleBody = article.blocks
    .filter(isRichTextBlock)
    .reduce((body, richText) => {
      const text = toPlaintext(richText.richText)

      if (text) {
        body.push(text)
      }

      return body
    }, [] as string[])
    .join('\n')

  const socialMediaDescription =
    article.socialMediaDescription ||
    article.lead ||
    firstParagraphToPlaintext(firstRichText?.richText)
  const description = article.lead || firstParagraphToPlaintext(firstRichText?.richText)

  const image =
    (article.socialMediaImage as FullImageFragment)?.largeURL ??
    article.socialMediaImage?.url ??
    (article.image as FullImageFragment)?.largeURL ??
    article.image?.url ??
    (firstImageBlock?.image as FullImageFragment)?.largeURL ??
    firstImageBlock?.image?.url

  const title = article.seoTitle || article.title || firstTitle?.title || article.socialMediaTitle
  const socialMediaTitle =
    article.socialMediaTitle || article.seoTitle || article.title || firstTitle?.title
  const headline = firstTitle?.title || article.title
  const url = article.canonicalUrl ?? article.url

  const firstAuthor = article.authors.at(0)

  return {
    type: 'article',
    socialMediaTitle,
    description,
    socialMediaDescription,
    url,
    image,
    tags: article.tags,
    publishedAt: article.publishedAt,
    authors: article.authors,
    schema: {
      '@context': 'http://schema.org',
      '@type': 'NewsArticle',
      articleBody,
      keywords: article.tags.join(','),
      image,
      description,
      author: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        image: (firstAuthor?.image as FullImageFragment)?.largeURL ?? firstAuthor?.image?.url,
        jobTitle: firstAuthor?.jobTitle,
        name: firstAuthor?.name,
        url: firstAuthor?.url
      },
      datePublished: article.publishedAt,
      name: title,
      headline,
      identifier: article.id,
      url
    }
  }
}

export const ArticleSEO = ({article}: BuilderArticleSEOProps) => {
  const {Head, Script} = useWebsiteBuilder()
  const seo = useMemo(() => getArticleSEO(article), [article])

  return (
    <>
      <Head>
        <meta key={'og:type'} property="og:type" content={seo.type} />

        {seo.socialMediaTitle && (
          <meta key={'og:title'} property="og:title" content={seo.socialMediaTitle} />
        )}

        {seo.socialMediaDescription && (
          <meta
            key={'og:description'}
            property="og:description"
            content={seo.socialMediaDescription}
          />
        )}

        {seo.description && (
          <meta key={'description'} name="description" content={seo.description} />
        )}

        <meta key={'og:url'} property="og:url" content={seo.url} />
        <link key={'canonical'} rel="canonical" href={seo.url} />

        {seo.image && <meta key={'og:image'} property="og:image" content={seo.image} />}

        <meta key={'twitter:card'} name="twitter:card" content="summary_large_image" />

        <meta
          key={`og:article:published_time`}
          property="og:article:published_time"
          content={seo.publishedAt}
        />

        <meta
          key={`og:article:modified_time`}
          property="og:article:modified_time"
          content={seo.publishedAt}
        />

        {seo.authors.map(author => (
          <Fragment key={author.id}>
            <meta key={`author:${author.id}`} name="author" content={author.name} />

            <meta
              key={`og:article:author:username:${author.id}`}
              property="og:article:author:username"
              content={author.name}
            />
          </Fragment>
        ))}

        {seo.tags.map(tag => (
          <meta key={`og:article:tag:${tag}`} property="og:article:tag" content={tag} />
        ))}
      </Head>

      <Script type="application/ld+json">{JSON.stringify(seo.schema)}</Script>
    </>
  )
}
