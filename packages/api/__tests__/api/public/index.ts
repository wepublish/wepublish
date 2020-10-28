// THIS FILE IS AUTOGENERATED, EDIT WITH CAUTION
import {Node} from 'slate'
import gql from 'graphql-tag'
export type Maybe<T> = T | null
export type Exact<T extends {[key: string]: unknown}> = {[K in keyof T]: T[K]}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: string
  /** A hexidecimal color value. */
  Color: string
  Slug: string
  RichText: Node[]
}

export type Article = {
  __typename?: 'Article'
  id: Scalars['ID']
  updatedAt: Scalars['DateTime']
  publishedAt: Scalars['DateTime']
  slug: Scalars['Slug']
  url: Scalars['String']
  preTitle?: Maybe<Scalars['String']>
  title: Scalars['String']
  lead?: Maybe<Scalars['String']>
  tags: Array<Scalars['String']>
  properties: Array<PublicProperties>
  image?: Maybe<Image>
  authors: Array<Maybe<Author>>
  breaking: Scalars['Boolean']
  blocks: Array<Block>
}

export type ArticleConnection = {
  __typename?: 'ArticleConnection'
  nodes: Array<Article>
  pageInfo: PageInfo
  totalCount: Scalars['Int']
}

export type ArticleFilter = {
  authors?: Maybe<Array<Scalars['ID']>>
  tags?: Maybe<Array<Scalars['String']>>
}

export type ArticleNavigationLink = BaseNavigationLink & {
  __typename?: 'ArticleNavigationLink'
  label: Scalars['String']
  article?: Maybe<Article>
}

export enum ArticleSort {
  PublishedAt = 'PUBLISHED_AT',
  UpdatedAt = 'UPDATED_AT'
}

export type ArticleTeaser = {
  __typename?: 'ArticleTeaser'
  style: TeaserStyle
  image?: Maybe<Image>
  preTitle?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  lead?: Maybe<Scalars['String']>
  article?: Maybe<Article>
}

export type Author = {
  __typename?: 'Author'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  modifiedAt: Scalars['DateTime']
  name: Scalars['String']
  slug: Scalars['Slug']
  url: Scalars['String']
  links?: Maybe<Array<AuthorLink>>
  bio?: Maybe<Scalars['RichText']>
  image?: Maybe<Image>
}

export type AuthorConnection = {
  __typename?: 'AuthorConnection'
  nodes: Array<Author>
  pageInfo: PageInfo
  totalCount: Scalars['Int']
}

export type AuthorFilter = {
  name?: Maybe<Scalars['String']>
}

export type AuthorLink = {
  __typename?: 'AuthorLink'
  title: Scalars['String']
  url: Scalars['String']
}

export enum AuthorSort {
  CreatedAt = 'CREATED_AT',
  ModifiedAt = 'MODIFIED_AT'
}

export type BaseNavigationLink = {
  label: Scalars['String']
}

export type Block =
  | RichTextBlock
  | ImageBlock
  | ImageGalleryBlock
  | ListicleBlock
  | FacebookPostBlock
  | InstagramPostBlock
  | TwitterTweetBlock
  | VimeoVideoBlock
  | YouTubeVideoBlock
  | SoundCloudTrackBlock
  | EmbedBlock
  | LinkPageBreakBlock
  | TitleBlock
  | QuoteBlock
  | TeaserGridBlock

export type EmbedBlock = {
  __typename?: 'EmbedBlock'
  url?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  width?: Maybe<Scalars['Int']>
  height?: Maybe<Scalars['Int']>
  styleCustom?: Maybe<Scalars['String']>
}

export type ExternalNavigationLink = BaseNavigationLink & {
  __typename?: 'ExternalNavigationLink'
  label: Scalars['String']
  url: Scalars['String']
}

export type FacebookPostBlock = {
  __typename?: 'FacebookPostBlock'
  userID: Scalars['String']
  postID: Scalars['String']
}

export type GalleryImageEdge = {
  __typename?: 'GalleryImageEdge'
  caption?: Maybe<Scalars['String']>
  image?: Maybe<Image>
}

export type Image = {
  __typename?: 'Image'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  modifiedAt: Scalars['DateTime']
  filename?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  tags: Array<Scalars['String']>
  source?: Maybe<Scalars['String']>
  author?: Maybe<Scalars['String']>
  license?: Maybe<Scalars['String']>
  fileSize: Scalars['Int']
  extension: Scalars['String']
  mimeType: Scalars['String']
  format: Scalars['String']
  width: Scalars['Int']
  height: Scalars['Int']
  focalPoint?: Maybe<Point>
  url?: Maybe<Scalars['String']>
  transformURL?: Maybe<Scalars['String']>
}

export type ImageTransformUrlArgs = {
  input?: Maybe<ImageTransformation>
}

export type ImageBlock = {
  __typename?: 'ImageBlock'
  image?: Maybe<Image>
  caption?: Maybe<Scalars['String']>
}

export type ImageGalleryBlock = {
  __typename?: 'ImageGalleryBlock'
  images: Array<GalleryImageEdge>
}

export enum ImageOutput {
  Png = 'PNG',
  Jpeg = 'JPEG',
  Webp = 'WEBP'
}

export enum ImageRotation {
  Auto = 'AUTO',
  Rotate_0 = 'ROTATE_0',
  Rotate_90 = 'ROTATE_90',
  Rotate_180 = 'ROTATE_180',
  Rotate_270 = 'ROTATE_270'
}

export type ImageTransformation = {
  width?: Maybe<Scalars['Int']>
  height?: Maybe<Scalars['Int']>
  rotation?: Maybe<ImageRotation>
  quality?: Maybe<Scalars['Float']>
  output?: Maybe<ImageOutput>
}

export type InstagramPostBlock = {
  __typename?: 'InstagramPostBlock'
  postID: Scalars['String']
}

export type LinkPageBreakBlock = {
  __typename?: 'LinkPageBreakBlock'
  text?: Maybe<Scalars['String']>
  richText?: Maybe<Scalars['RichText']>
  linkURL?: Maybe<Scalars['String']>
  linkText?: Maybe<Scalars['String']>
  linkTarget?: Maybe<Scalars['String']>
  hideButton?: Maybe<Scalars['Boolean']>
  styleOption?: Maybe<Scalars['String']>
  layoutOption?: Maybe<Scalars['String']>
  templateOption?: Maybe<Scalars['String']>
  image?: Maybe<Image>
}

export type ListicleBlock = {
  __typename?: 'ListicleBlock'
  items: Array<ListicleItem>
}

export type ListicleItem = {
  __typename?: 'ListicleItem'
  title: Scalars['String']
  image?: Maybe<Image>
  richText: Scalars['RichText']
}

export type Navigation = {
  __typename?: 'Navigation'
  id: Scalars['ID']
  key: Scalars['String']
  name: Scalars['String']
  links: Array<NavigationLink>
}

export type NavigationLink = PageNavigationLink | ArticleNavigationLink | ExternalNavigationLink

export type Page = {
  __typename?: 'Page'
  id: Scalars['ID']
  updatedAt: Scalars['DateTime']
  publishedAt: Scalars['DateTime']
  slug: Scalars['Slug']
  url: Scalars['String']
  title: Scalars['String']
  description?: Maybe<Scalars['String']>
  tags: Array<Scalars['String']>
  properties: Array<PublicProperties>
  image?: Maybe<Image>
  blocks: Array<Block>
}

export type PageConnection = {
  __typename?: 'PageConnection'
  nodes: Array<Page>
  pageInfo: PageInfo
  totalCount: Scalars['Int']
}

export type PageInfo = {
  __typename?: 'PageInfo'
  startCursor?: Maybe<Scalars['String']>
  endCursor?: Maybe<Scalars['String']>
  hasNextPage: Scalars['Boolean']
  hasPreviousPage: Scalars['Boolean']
}

export type PageNavigationLink = BaseNavigationLink & {
  __typename?: 'PageNavigationLink'
  label: Scalars['String']
  page?: Maybe<Page>
}

export type PageTeaser = {
  __typename?: 'PageTeaser'
  style: TeaserStyle
  image?: Maybe<Image>
  preTitle?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  lead?: Maybe<Scalars['String']>
  page?: Maybe<Page>
}

export type Peer = {
  __typename?: 'Peer'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  modifiedAt: Scalars['DateTime']
  name: Scalars['String']
  slug: Scalars['String']
  hostURL: Scalars['String']
  profile?: Maybe<PeerProfile>
}

export type PeerArticleTeaser = {
  __typename?: 'PeerArticleTeaser'
  style: TeaserStyle
  image?: Maybe<Image>
  preTitle?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  lead?: Maybe<Scalars['String']>
  peer?: Maybe<Peer>
  articleID: Scalars['ID']
  article?: Maybe<Article>
}

export type PeerProfile = {
  __typename?: 'PeerProfile'
  name: Scalars['String']
  logo?: Maybe<Image>
  themeColor: Scalars['Color']
  hostURL: Scalars['String']
  websiteURL: Scalars['String']
}

export type Point = {
  __typename?: 'Point'
  x: Scalars['Float']
  y: Scalars['Float']
}

export type PublicProperties = {
  __typename?: 'PublicProperties'
  key: Scalars['String']
  value: Scalars['String']
}

export type PublishedPageFilter = {
  tags?: Maybe<Array<Scalars['String']>>
}

export enum PublishedPageSort {
  PublishedAt = 'PUBLISHED_AT',
  UpdatedAt = 'UPDATED_AT'
}

export type Query = {
  __typename?: 'Query'
  peerProfile: PeerProfile
  peer?: Maybe<Peer>
  navigation?: Maybe<Navigation>
  author?: Maybe<Author>
  authors: AuthorConnection
  article?: Maybe<Article>
  articles: ArticleConnection
  peerArticle?: Maybe<Article>
  page?: Maybe<Page>
  pages: PageConnection
}

export type QueryPeerArgs = {
  id?: Maybe<Scalars['ID']>
  slug?: Maybe<Scalars['Slug']>
}

export type QueryNavigationArgs = {
  id?: Maybe<Scalars['ID']>
  key?: Maybe<Scalars['ID']>
}

export type QueryAuthorArgs = {
  id?: Maybe<Scalars['ID']>
  slug?: Maybe<Scalars['Slug']>
}

export type QueryAuthorsArgs = {
  after?: Maybe<Scalars['ID']>
  before?: Maybe<Scalars['ID']>
  first?: Maybe<Scalars['Int']>
  last?: Maybe<Scalars['Int']>
  filter?: Maybe<AuthorFilter>
  sort?: Maybe<AuthorSort>
  order?: Maybe<SortOrder>
}

export type QueryArticleArgs = {
  id?: Maybe<Scalars['ID']>
}

export type QueryArticlesArgs = {
  after?: Maybe<Scalars['ID']>
  before?: Maybe<Scalars['ID']>
  first?: Maybe<Scalars['Int']>
  last?: Maybe<Scalars['Int']>
  filter?: Maybe<ArticleFilter>
  sort?: Maybe<ArticleSort>
  order?: Maybe<SortOrder>
}

export type QueryPeerArticleArgs = {
  peerID?: Maybe<Scalars['ID']>
  peerSlug?: Maybe<Scalars['Slug']>
  id: Scalars['ID']
}

export type QueryPageArgs = {
  id?: Maybe<Scalars['ID']>
  slug?: Maybe<Scalars['Slug']>
}

export type QueryPagesArgs = {
  after?: Maybe<Scalars['ID']>
  before?: Maybe<Scalars['ID']>
  first?: Maybe<Scalars['Int']>
  last?: Maybe<Scalars['Int']>
  filter?: Maybe<PublishedPageFilter>
  sort?: Maybe<PublishedPageSort>
  order?: Maybe<SortOrder>
}

export type QuoteBlock = {
  __typename?: 'QuoteBlock'
  quote?: Maybe<Scalars['String']>
  author?: Maybe<Scalars['String']>
}

export type RichTextBlock = {
  __typename?: 'RichTextBlock'
  richText: Scalars['RichText']
}

export enum SortOrder {
  Ascending = 'ASCENDING',
  Descending = 'DESCENDING'
}

export type SoundCloudTrackBlock = {
  __typename?: 'SoundCloudTrackBlock'
  trackID: Scalars['String']
}

export type Teaser = ArticleTeaser | PeerArticleTeaser | PageTeaser

export type TeaserGridBlock = {
  __typename?: 'TeaserGridBlock'
  teasers: Array<Maybe<Teaser>>
  numColumns: Scalars['Int']
}

export enum TeaserStyle {
  Default = 'DEFAULT',
  Light = 'LIGHT',
  Text = 'TEXT'
}

export type TitleBlock = {
  __typename?: 'TitleBlock'
  title?: Maybe<Scalars['String']>
  lead?: Maybe<Scalars['String']>
}

export type TwitterTweetBlock = {
  __typename?: 'TwitterTweetBlock'
  userID: Scalars['String']
  tweetID: Scalars['String']
}

export type VimeoVideoBlock = {
  __typename?: 'VimeoVideoBlock'
  videoID: Scalars['String']
}

export type YouTubeVideoBlock = {
  __typename?: 'YouTubeVideoBlock'
  videoID: Scalars['String']
}

export type ArticleRefFragment = {__typename?: 'Article'} & Pick<
  Article,
  'id' | 'publishedAt' | 'updatedAt' | 'tags' | 'preTitle' | 'title' | 'lead'
> & {image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>}

export type ArticleListQueryVariables = Exact<{
  filter?: Maybe<Array<Scalars['String']>>
  after?: Maybe<Scalars['ID']>
  first?: Maybe<Scalars['Int']>
}>

export type ArticleListQuery = {__typename?: 'Query'} & {
  articles: {__typename?: 'ArticleConnection'} & Pick<ArticleConnection, 'totalCount'> & {
      nodes: Array<{__typename?: 'Article'} & ArticleRefFragment>
      pageInfo: {__typename?: 'PageInfo'} & Pick<
        PageInfo,
        'startCursor' | 'endCursor' | 'hasNextPage' | 'hasPreviousPage'
      >
    }
}

export type ArticleQueryVariables = Exact<{
  id: Scalars['ID']
}>

export type ArticleQuery = {__typename?: 'Query'} & {
  article?: Maybe<
    {__typename?: 'Article'} & Pick<
      Article,
      | 'id'
      | 'updatedAt'
      | 'publishedAt'
      | 'slug'
      | 'url'
      | 'preTitle'
      | 'title'
      | 'lead'
      | 'tags'
      | 'breaking'
    > & {
        properties: Array<
          {__typename?: 'PublicProperties'} & Pick<PublicProperties, 'key' | 'value'>
        >
        image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
        authors: Array<Maybe<{__typename?: 'Author'} & AuthorRefFragment>>
        blocks: Array<
          | ({__typename?: 'RichTextBlock'} & FullBlock_RichTextBlock_Fragment)
          | ({__typename?: 'ImageBlock'} & FullBlock_ImageBlock_Fragment)
          | ({__typename?: 'ImageGalleryBlock'} & FullBlock_ImageGalleryBlock_Fragment)
          | ({__typename?: 'ListicleBlock'} & FullBlock_ListicleBlock_Fragment)
          | ({__typename?: 'FacebookPostBlock'} & FullBlock_FacebookPostBlock_Fragment)
          | ({__typename?: 'InstagramPostBlock'} & FullBlock_InstagramPostBlock_Fragment)
          | ({__typename?: 'TwitterTweetBlock'} & FullBlock_TwitterTweetBlock_Fragment)
          | ({__typename?: 'VimeoVideoBlock'} & FullBlock_VimeoVideoBlock_Fragment)
          | ({__typename?: 'YouTubeVideoBlock'} & FullBlock_YouTubeVideoBlock_Fragment)
          | ({__typename?: 'SoundCloudTrackBlock'} & FullBlock_SoundCloudTrackBlock_Fragment)
          | ({__typename?: 'EmbedBlock'} & FullBlock_EmbedBlock_Fragment)
          | ({__typename?: 'LinkPageBreakBlock'} & FullBlock_LinkPageBreakBlock_Fragment)
          | ({__typename?: 'TitleBlock'} & FullBlock_TitleBlock_Fragment)
          | ({__typename?: 'QuoteBlock'} & FullBlock_QuoteBlock_Fragment)
          | ({__typename?: 'TeaserGridBlock'} & FullBlock_TeaserGridBlock_Fragment)
        >
      }
  >
}

export type PeerArticleQueryVariables = Exact<{
  id: Scalars['ID']
  peerSlug?: Maybe<Scalars['Slug']>
  peerID?: Maybe<Scalars['ID']>
}>

export type PeerArticleQuery = {__typename?: 'Query'} & {
  peerArticle?: Maybe<
    {__typename?: 'Article'} & Pick<
      Article,
      | 'id'
      | 'updatedAt'
      | 'publishedAt'
      | 'slug'
      | 'url'
      | 'preTitle'
      | 'title'
      | 'lead'
      | 'tags'
      | 'breaking'
    > & {
        properties: Array<
          {__typename?: 'PublicProperties'} & Pick<PublicProperties, 'key' | 'value'>
        >
        image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
        authors: Array<Maybe<{__typename?: 'Author'} & AuthorRefFragment>>
        blocks: Array<
          | ({__typename?: 'RichTextBlock'} & FullBlock_RichTextBlock_Fragment)
          | ({__typename?: 'ImageBlock'} & FullBlock_ImageBlock_Fragment)
          | ({__typename?: 'ImageGalleryBlock'} & FullBlock_ImageGalleryBlock_Fragment)
          | ({__typename?: 'ListicleBlock'} & FullBlock_ListicleBlock_Fragment)
          | ({__typename?: 'FacebookPostBlock'} & FullBlock_FacebookPostBlock_Fragment)
          | ({__typename?: 'InstagramPostBlock'} & FullBlock_InstagramPostBlock_Fragment)
          | ({__typename?: 'TwitterTweetBlock'} & FullBlock_TwitterTweetBlock_Fragment)
          | ({__typename?: 'VimeoVideoBlock'} & FullBlock_VimeoVideoBlock_Fragment)
          | ({__typename?: 'YouTubeVideoBlock'} & FullBlock_YouTubeVideoBlock_Fragment)
          | ({__typename?: 'SoundCloudTrackBlock'} & FullBlock_SoundCloudTrackBlock_Fragment)
          | ({__typename?: 'EmbedBlock'} & FullBlock_EmbedBlock_Fragment)
          | ({__typename?: 'LinkPageBreakBlock'} & FullBlock_LinkPageBreakBlock_Fragment)
          | ({__typename?: 'TitleBlock'} & FullBlock_TitleBlock_Fragment)
          | ({__typename?: 'QuoteBlock'} & FullBlock_QuoteBlock_Fragment)
          | ({__typename?: 'TeaserGridBlock'} & FullBlock_TeaserGridBlock_Fragment)
        >
      }
  >
}

export type AuthorRefFragment = {__typename?: 'Author'} & Pick<Author, 'id' | 'name'> & {
    image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
  }

export type FullAuthorFragment = {__typename?: 'Author'} & Pick<Author, 'slug' | 'bio'> & {
    links?: Maybe<Array<{__typename?: 'AuthorLink'} & Pick<AuthorLink, 'title' | 'url'>>>
  } & AuthorRefFragment

export type AuthorListQueryVariables = Exact<{
  filter?: Maybe<Scalars['String']>
  after?: Maybe<Scalars['ID']>
  before?: Maybe<Scalars['ID']>
  first?: Maybe<Scalars['Int']>
  last?: Maybe<Scalars['Int']>
}>

export type AuthorListQuery = {__typename?: 'Query'} & {
  authors: {__typename?: 'AuthorConnection'} & Pick<AuthorConnection, 'totalCount'> & {
      nodes: Array<{__typename?: 'Author'} & FullAuthorFragment>
      pageInfo: {__typename?: 'PageInfo'} & Pick<
        PageInfo,
        'startCursor' | 'endCursor' | 'hasNextPage' | 'hasPreviousPage'
      >
    }
}

export type AuthorQueryVariables = Exact<{
  id: Scalars['ID']
}>

export type AuthorQuery = {__typename?: 'Query'} & {
  author?: Maybe<{__typename?: 'Author'} & FullAuthorFragment>
}

type FullTeaser_ArticleTeaser_Fragment = {__typename?: 'ArticleTeaser'} & Pick<
  ArticleTeaser,
  'style' | 'preTitle' | 'title' | 'lead'
> & {
    image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
    article?: Maybe<{__typename?: 'Article'} & ArticleRefFragment>
  }

type FullTeaser_PeerArticleTeaser_Fragment = {__typename?: 'PeerArticleTeaser'} & Pick<
  PeerArticleTeaser,
  'style' | 'preTitle' | 'title' | 'lead' | 'articleID'
> & {
    image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
    peer?: Maybe<{__typename?: 'Peer'} & PeerWithProfileFragment>
    article?: Maybe<{__typename?: 'Article'} & ArticleRefFragment>
  }

type FullTeaser_PageTeaser_Fragment = {__typename?: 'PageTeaser'} & Pick<
  PageTeaser,
  'style' | 'preTitle' | 'title' | 'lead'
> & {
    image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
    page?: Maybe<{__typename?: 'Page'} & PageRefFragment>
  }

export type FullTeaserFragment =
  | FullTeaser_ArticleTeaser_Fragment
  | FullTeaser_PeerArticleTeaser_Fragment
  | FullTeaser_PageTeaser_Fragment

type FullBlock_RichTextBlock_Fragment = {__typename: 'RichTextBlock'} & Pick<
  RichTextBlock,
  'richText'
>

type FullBlock_ImageBlock_Fragment = {__typename: 'ImageBlock'} & Pick<ImageBlock, 'caption'> & {
    image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
  }

type FullBlock_ImageGalleryBlock_Fragment = {__typename: 'ImageGalleryBlock'} & {
  images: Array<
    {__typename?: 'GalleryImageEdge'} & Pick<GalleryImageEdge, 'caption'> & {
        image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
      }
  >
}

type FullBlock_ListicleBlock_Fragment = {__typename: 'ListicleBlock'} & {
  items: Array<
    {__typename?: 'ListicleItem'} & Pick<ListicleItem, 'title' | 'richText'> & {
        image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
      }
  >
}

type FullBlock_FacebookPostBlock_Fragment = {__typename: 'FacebookPostBlock'} & Pick<
  FacebookPostBlock,
  'userID' | 'postID'
>

type FullBlock_InstagramPostBlock_Fragment = {__typename: 'InstagramPostBlock'} & Pick<
  InstagramPostBlock,
  'postID'
>

type FullBlock_TwitterTweetBlock_Fragment = {__typename: 'TwitterTweetBlock'} & Pick<
  TwitterTweetBlock,
  'userID' | 'tweetID'
>

type FullBlock_VimeoVideoBlock_Fragment = {__typename: 'VimeoVideoBlock'} & Pick<
  VimeoVideoBlock,
  'videoID'
>

type FullBlock_YouTubeVideoBlock_Fragment = {__typename: 'YouTubeVideoBlock'} & Pick<
  YouTubeVideoBlock,
  'videoID'
>

type FullBlock_SoundCloudTrackBlock_Fragment = {__typename: 'SoundCloudTrackBlock'} & Pick<
  SoundCloudTrackBlock,
  'trackID'
>

type FullBlock_EmbedBlock_Fragment = {__typename: 'EmbedBlock'} & Pick<
  EmbedBlock,
  'url' | 'title' | 'width' | 'height' | 'styleCustom'
>

type FullBlock_LinkPageBreakBlock_Fragment = {__typename: 'LinkPageBreakBlock'} & Pick<
  LinkPageBreakBlock,
  | 'text'
  | 'linkText'
  | 'linkURL'
  | 'styleOption'
  | 'layoutOption'
  | 'linkTarget'
  | 'hideButton'
  | 'templateOption'
  | ('richText' & {
      image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
    })
>

type FullBlock_TitleBlock_Fragment = {__typename: 'TitleBlock'} & Pick<TitleBlock, 'title' | 'lead'>

type FullBlock_QuoteBlock_Fragment = {__typename: 'QuoteBlock'} & Pick<
  QuoteBlock,
  'quote' | 'author'
>

type FullBlock_TeaserGridBlock_Fragment = {__typename: 'TeaserGridBlock'} & Pick<
  TeaserGridBlock,
  'numColumns'
> & {
    teasers: Array<
      Maybe<
        | ({__typename?: 'ArticleTeaser'} & FullTeaser_ArticleTeaser_Fragment)
        | ({__typename?: 'PeerArticleTeaser'} & FullTeaser_PeerArticleTeaser_Fragment)
        | ({__typename?: 'PageTeaser'} & FullTeaser_PageTeaser_Fragment)
      >
    >
  }

export type FullBlockFragment =
  | FullBlock_RichTextBlock_Fragment
  | FullBlock_ImageBlock_Fragment
  | FullBlock_ImageGalleryBlock_Fragment
  | FullBlock_ListicleBlock_Fragment
  | FullBlock_FacebookPostBlock_Fragment
  | FullBlock_InstagramPostBlock_Fragment
  | FullBlock_TwitterTweetBlock_Fragment
  | FullBlock_VimeoVideoBlock_Fragment
  | FullBlock_YouTubeVideoBlock_Fragment
  | FullBlock_SoundCloudTrackBlock_Fragment
  | FullBlock_EmbedBlock_Fragment
  | FullBlock_LinkPageBreakBlock_Fragment
  | FullBlock_TitleBlock_Fragment
  | FullBlock_QuoteBlock_Fragment
  | FullBlock_TeaserGridBlock_Fragment

export type ImageUrLsFragment = {__typename?: 'Image'} & Pick<Image, 'url'> & {
    largeURL: Image['transformURL']
    mediumURL: Image['transformURL']
    thumbURL: Image['transformURL']
    squareURL: Image['transformURL']
    previewURL: Image['transformURL']
    column1URL: Image['transformURL']
    column6URL: Image['transformURL']
  }

export type ImageRefFragment = {__typename?: 'Image'} & Pick<
  Image,
  'id' | 'filename' | 'extension' | 'title' | 'description' | 'width' | 'height'
> &
  ImageUrLsFragment

export type FullImageFragment = {__typename?: 'Image'} & Pick<
  Image,
  | 'id'
  | 'createdAt'
  | 'modifiedAt'
  | 'filename'
  | 'extension'
  | 'width'
  | 'height'
  | 'fileSize'
  | 'description'
  | 'tags'
  | 'author'
  | 'source'
  | 'license'
> & {focalPoint?: Maybe<{__typename?: 'Point'} & Pick<Point, 'x' | 'y'>>} & ImageRefFragment

export type PageRefFragment = {__typename?: 'Page'} & Pick<
  Page,
  'id' | 'publishedAt' | 'updatedAt' | 'title' | 'description'
> & {image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>}

export type PageListQueryVariables = Exact<{
  filter?: Maybe<Array<Scalars['String']>>
  after?: Maybe<Scalars['ID']>
  first?: Maybe<Scalars['Int']>
}>

export type PageListQuery = {__typename?: 'Query'} & {
  pages: {__typename?: 'PageConnection'} & Pick<PageConnection, 'totalCount'> & {
      nodes: Array<{__typename?: 'Page'} & PageRefFragment>
      pageInfo: {__typename?: 'PageInfo'} & Pick<
        PageInfo,
        'startCursor' | 'endCursor' | 'hasNextPage' | 'hasPreviousPage'
      >
    }
}

export type PageQueryVariables = Exact<{
  id: Scalars['ID']
}>

export type PageQuery = {__typename?: 'Query'} & {
  page?: Maybe<
    {__typename?: 'Page'} & Pick<
      Page,
      'id' | 'publishedAt' | 'updatedAt' | 'slug' | 'title' | 'description' | 'tags'
    > & {
        image?: Maybe<{__typename?: 'Image'} & ImageRefFragment>
        properties: Array<
          {__typename?: 'PublicProperties'} & Pick<PublicProperties, 'key' | 'value'>
        >
        blocks: Array<
          | ({__typename?: 'RichTextBlock'} & FullBlock_RichTextBlock_Fragment)
          | ({__typename?: 'ImageBlock'} & FullBlock_ImageBlock_Fragment)
          | ({__typename?: 'ImageGalleryBlock'} & FullBlock_ImageGalleryBlock_Fragment)
          | ({__typename?: 'ListicleBlock'} & FullBlock_ListicleBlock_Fragment)
          | ({__typename?: 'FacebookPostBlock'} & FullBlock_FacebookPostBlock_Fragment)
          | ({__typename?: 'InstagramPostBlock'} & FullBlock_InstagramPostBlock_Fragment)
          | ({__typename?: 'TwitterTweetBlock'} & FullBlock_TwitterTweetBlock_Fragment)
          | ({__typename?: 'VimeoVideoBlock'} & FullBlock_VimeoVideoBlock_Fragment)
          | ({__typename?: 'YouTubeVideoBlock'} & FullBlock_YouTubeVideoBlock_Fragment)
          | ({__typename?: 'SoundCloudTrackBlock'} & FullBlock_SoundCloudTrackBlock_Fragment)
          | ({__typename?: 'EmbedBlock'} & FullBlock_EmbedBlock_Fragment)
          | ({__typename?: 'LinkPageBreakBlock'} & FullBlock_LinkPageBreakBlock_Fragment)
          | ({__typename?: 'TitleBlock'} & FullBlock_TitleBlock_Fragment)
          | ({__typename?: 'QuoteBlock'} & FullBlock_QuoteBlock_Fragment)
          | ({__typename?: 'TeaserGridBlock'} & FullBlock_TeaserGridBlock_Fragment)
        >
      }
  >
}

export type FullPeerProfileFragment = {__typename?: 'PeerProfile'} & Pick<
  PeerProfile,
  'name' | 'hostURL' | 'themeColor'
> & {logo?: Maybe<{__typename?: 'Image'} & ImageRefFragment>}

export type PeerRefFragment = {__typename?: 'Peer'} & Pick<Peer, 'id' | 'name' | 'slug' | 'hostURL'>

export type PeerWithProfileFragment = {__typename?: 'Peer'} & {
  profile?: Maybe<{__typename?: 'PeerProfile'} & FullPeerProfileFragment>
} & PeerRefFragment

export type PeerProfileQueryVariables = Exact<{[key: string]: never}>

export type PeerProfileQuery = {__typename?: 'Query'} & {
  peerProfile: {__typename?: 'PeerProfile'} & FullPeerProfileFragment
}

export type PeerQueryVariables = Exact<{
  id: Scalars['ID']
}>

export type PeerQuery = {__typename?: 'Query'} & {
  peer?: Maybe<{__typename?: 'Peer'} & PeerRefFragment>
}

export const ImageUrLs = gql`
  fragment ImageURLs on Image {
    url
    largeURL: transformURL(input: {width: 500})
    mediumURL: transformURL(input: {width: 300})
    thumbURL: transformURL(input: {width: 280, height: 200})
    squareURL: transformURL(input: {width: 100, height: 100})
    previewURL: transformURL(input: {width: 400, height: 200})
    column1URL: transformURL(input: {width: 800, height: 300})
    column6URL: transformURL(input: {width: 260, height: 300})
  }
`
export const ImageRef = gql`
  fragment ImageRef on Image {
    id
    filename
    extension
    title
    description
    width
    height
    ...ImageURLs
  }
  ${ImageUrLs}
`
export const AuthorRef = gql`
  fragment AuthorRef on Author {
    id
    name
    image {
      ...ImageRef
    }
  }
  ${ImageRef}
`
export const FullAuthor = gql`
  fragment FullAuthor on Author {
    slug
    links {
      title
      url
    }
    bio
    ...AuthorRef
  }
  ${AuthorRef}
`
export const ArticleRef = gql`
  fragment ArticleRef on Article {
    id
    publishedAt
    updatedAt
    tags
    preTitle
    title
    lead
    image {
      ...ImageRef
    }
  }
  ${ImageRef}
`
export const PeerRef = gql`
  fragment PeerRef on Peer {
    id
    name
    slug
    hostURL
  }
`
export const FullPeerProfile = gql`
  fragment FullPeerProfile on PeerProfile {
    name
    hostURL
    themeColor
    logo {
      ...ImageRef
    }
  }
  ${ImageRef}
`
export const PeerWithProfile = gql`
  fragment PeerWithProfile on Peer {
    ...PeerRef
    profile {
      ...FullPeerProfile
    }
  }
  ${PeerRef}
  ${FullPeerProfile}
`
export const PageRef = gql`
  fragment PageRef on Page {
    id
    publishedAt
    updatedAt
    title
    description
    image {
      ...ImageRef
    }
  }
  ${ImageRef}
`
export const FullTeaser = gql`
  fragment FullTeaser on Teaser {
    ... on ArticleTeaser {
      style
      image {
        ...ImageRef
      }
      preTitle
      title
      lead
      article {
        ...ArticleRef
      }
    }
    ... on PeerArticleTeaser {
      style
      image {
        ...ImageRef
      }
      preTitle
      title
      lead
      peer {
        ...PeerWithProfile
      }
      articleID
      article {
        ...ArticleRef
      }
    }
    ... on PageTeaser {
      style
      image {
        ...ImageRef
      }
      preTitle
      title
      lead
      page {
        ...PageRef
      }
    }
  }
  ${ImageRef}
  ${ArticleRef}
  ${PeerWithProfile}
  ${PageRef}
`
export const FullBlock = gql`
  fragment FullBlock on Block {
    __typename
    ... on TitleBlock {
      title
      lead
    }
    ... on RichTextBlock {
      richText
    }
    ... on QuoteBlock {
      quote
      author
    }
    ... on LinkPageBreakBlock {
      text
      richText
      linkText
      linkTarget
      hideButton
      linkURL
      styleOption
      layoutOption
      templateOption
      image {
        ...ImageRef
      }
    }
    ... on ImageBlock {
      caption
      image {
        ...ImageRef
      }
    }
    ... on ImageGalleryBlock {
      images {
        caption
        image {
          ...ImageRef
        }
      }
    }
    ... on ListicleBlock {
      items {
        title
        image {
          ...ImageRef
        }
        richText
      }
    }
    ... on FacebookPostBlock {
      userID
      postID
    }
    ... on InstagramPostBlock {
      postID
    }
    ... on TwitterTweetBlock {
      userID
      tweetID
    }
    ... on VimeoVideoBlock {
      videoID
    }
    ... on YouTubeVideoBlock {
      videoID
    }
    ... on SoundCloudTrackBlock {
      trackID
    }
    ... on EmbedBlock {
      url
      title
      width
      height
      styleCustom
    }
    ... on TeaserGridBlock {
      teasers {
        ...FullTeaser
      }
      numColumns
    }
  }
  ${ImageRef}
  ${FullTeaser}
`
export const FullImage = gql`
  fragment FullImage on Image {
    id
    createdAt
    modifiedAt
    filename
    extension
    width
    height
    fileSize
    description
    tags
    author
    source
    license
    focalPoint {
      x
      y
    }
    ...ImageRef
  }
  ${ImageRef}
`
export const ArticleList = gql`
  query ArticleList($filter: [String!], $after: ID, $first: Int) {
    articles(first: $first, after: $after, filter: {tags: $filter}) {
      nodes {
        ...ArticleRef
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
  ${ArticleRef}
`
export const Article = gql`
  query Article($id: ID!) {
    article(id: $id) {
      id
      updatedAt
      publishedAt
      slug
      url
      preTitle
      title
      lead
      tags
      properties {
        key
        value
      }
      image {
        ...ImageRef
      }
      authors {
        ...AuthorRef
      }
      breaking
      blocks {
        ...FullBlock
      }
    }
  }
  ${ImageRef}
  ${AuthorRef}
  ${FullBlock}
`
export const PeerArticle = gql`
  query PeerArticle($id: ID!, $peerSlug: Slug, $peerID: ID) {
    peerArticle(id: $id, peerSlug: $peerSlug, peerID: $peerID) {
      id
      updatedAt
      publishedAt
      slug
      url
      preTitle
      title
      lead
      tags
      properties {
        key
        value
      }
      image {
        ...ImageRef
      }
      authors {
        ...AuthorRef
      }
      breaking
      blocks {
        ...FullBlock
      }
    }
  }
  ${ImageRef}
  ${AuthorRef}
  ${FullBlock}
`
export const AuthorList = gql`
  query AuthorList($filter: String, $after: ID, $before: ID, $first: Int, $last: Int) {
    authors(filter: {name: $filter}, after: $after, before: $before, first: $first, last: $last) {
      nodes {
        ...FullAuthor
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
  ${FullAuthor}
`
export const Author = gql`
  query Author($id: ID!) {
    author(id: $id) {
      ...FullAuthor
    }
  }
  ${FullAuthor}
`
export const PageList = gql`
  query PageList($filter: [String!], $after: ID, $first: Int) {
    pages(first: $first, after: $after, filter: {tags: $filter}) {
      nodes {
        ...PageRef
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
  ${PageRef}
`
export const Page = gql`
  query Page($id: ID!) {
    page(id: $id) {
      id
      publishedAt
      updatedAt
      slug
      title
      description
      image {
        ...ImageRef
      }
      tags
      properties {
        key
        value
      }
      blocks {
        ...FullBlock
      }
    }
  }
  ${ImageRef}
  ${FullBlock}
`
export const PeerProfile = gql`
  query PeerProfile {
    peerProfile {
      ...FullPeerProfile
    }
  }
  ${FullPeerProfile}
`
export const Peer = gql`
  query Peer($id: ID!) {
    peer(id: $id) {
      ...PeerRef
    }
  }
  ${PeerRef}
`
