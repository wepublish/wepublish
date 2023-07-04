import {isImageBlock, isRichTextBlock, isTitleBlock} from '@wepublish/block-content/website'
import {firstParagraphToPlaintext} from '@wepublish/richtext'
import {FullImageFragment, Page} from '@wepublish/website/api'
import {BuilderPageSEOProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useMemo} from 'react'

export const getPageSEO = (page: Page) => {
  const firstTitle = page.blocks.find(isTitleBlock)
  const firstRichText = page.blocks.find(isRichTextBlock)
  const firstImageBlock = page.blocks.find(isImageBlock)

  const socialMediaDescription =
    page.socialMediaDescription ||
    page.description ||
    firstParagraphToPlaintext(firstRichText?.richText)
  const description =
    page.socialMediaDescription ||
    page.description ||
    firstParagraphToPlaintext(firstRichText?.richText)
  const image =
    (page.socialMediaImage as FullImageFragment)?.largeURL ??
    page.socialMediaImage?.url ??
    (page.image as FullImageFragment)?.largeURL ??
    page.image?.url ??
    (firstImageBlock?.image as FullImageFragment)?.largeURL ??
    firstImageBlock?.image?.url

  const title = page.title || firstTitle?.title || page.socialMediaTitle
  const socialMediaTitle = page.socialMediaTitle || page.title || firstTitle?.title
  const headline = firstTitle?.title || page.title
  const url = page.url

  return {
    type: 'website',
    socialMediaTitle,
    description,
    socialMediaDescription,
    url,
    image,
    tags: page.tags,
    publishedAt: page.publishedAt,
    schema: {
      '@context': 'http://schema.org',
      '@type': 'WebPage',
      keywords: page.tags.join(','),
      image,
      description,
      datePublished: page.publishedAt,
      name: title,
      headline,
      identifier: page.id,
      url
    }
  }
}

export const PageSEO = ({page}: BuilderPageSEOProps) => {
  const {Head, Script} = useWebsiteBuilder()
  const seo = useMemo(() => getPageSEO(page), [page])

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
      </Head>

      <Script type="application/ld+json">{JSON.stringify(seo.schema)}</Script>
    </>
  )
}
