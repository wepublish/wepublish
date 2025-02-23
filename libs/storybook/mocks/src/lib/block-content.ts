import {
  BlockType,
  BreakBlock,
  EventBlock,
  FullBlockFragment,
  ImageBlock,
  PollBlock,
  QuoteBlock,
  RichTextBlock,
  TitleBlock,
  HtmlBlock,
  ListicleBlock,
  ListicleItem,
  CommentBlock,
  BildwurfAdBlock,
  FacebookPostBlock,
  FacebookVideoBlock,
  InstagramPostBlock,
  TikTokVideoBlock,
  VimeoVideoBlock,
  YouTubeVideoBlock,
  SoundCloudTrackBlock,
  TwitterTweetBlock,
  PolisConversationBlock,
  IFrameBlock,
  ImageGalleryBlock,
  TeaserType,
  FullEventTeaserFragment,
  FullPageTeaserFragment,
  FullArticleTeaserFragment,
  FullTeaserListBlockFragment,
  FullTeaserGridBlockFragment,
  CustomTeaser,
  FullTeaserGridFlexBlockFragment,
  FlexAlignment
} from '@wepublish/website/api'
import {mockImage} from './image'
import {mockRichText} from './richtext'
import {mockPoll} from './poll'
import {mockEvent} from './event'
import {mockComment} from './comment'
import {mockArticle, mockArticleRevision} from './article'
import {mockPage, mockPageRevision} from './page'
import nanoid from 'nanoid'

export const mockTitleBlock = ({
  title = 'Title Block',
  lead = 'Lead'
}: Partial<TitleBlock> = {}): TitleBlock => ({
  type: BlockType.Title,
  __typename: 'TitleBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  lead,
  title
})

export const mockImageBlock = ({image = mockImage()}: Partial<ImageBlock> = {}): ImageBlock => ({
  type: BlockType.Image,
  __typename: 'ImageBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  caption: 'Caption',
  image
})

export const mockRichTextBlock = ({
  richText = mockRichText()
}: Partial<RichTextBlock> = {}): RichTextBlock => ({
  type: BlockType.RichText,
  __typename: 'RichTextBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  richText
})

export const mockQuoteBlock = ({
  image = mockImage(),
  author = 'John Doe',
  quote = 'This is a quote that is very long so that we can make sure that linebreaks correctly happen.'
}: Partial<QuoteBlock> = {}): QuoteBlock => ({
  type: BlockType.Quote,
  __typename: 'QuoteBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  quote,
  author,
  image
})

export const mockBreakBlock = ({
  hideButton = true,
  image = mockImage(),
  richText = mockRichText(),
  linkTarget = '__blank',
  linkText = 'Button Text',
  linkURL = 'https://example.com',
  text = 'Foobar'
}: Partial<BreakBlock> = {}): BreakBlock => ({
  type: BlockType.LinkPageBreak,
  __typename: 'BreakBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  richText,
  hideButton,
  image,
  linkTarget,
  linkText,
  linkURL,
  text
})

export const mockPollBlock = ({poll = mockPoll()}: Partial<PollBlock> = {}): PollBlock => ({
  type: BlockType.Poll,
  __typename: 'PollBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  poll
})

export const mockEventBlock = ({
  events = [mockEvent(), mockEvent(), mockEvent(), mockEvent(), mockEvent(), mockEvent()]
}: Partial<EventBlock> = {}): EventBlock => ({
  type: BlockType.Event,
  __typename: 'EventBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  events,
  filter: {
    __typename: 'EventBlockFilter',
    events: events.map(({id}) => id),
    tags: []
  }
})

export const mockHTMLBlock = ({
  html = '<script>console.log("html block");</script>'
}: Partial<HtmlBlock> = {}): HtmlBlock => ({
  type: BlockType.Html,
  __typename: 'HTMLBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  html
})

export const mockListicleBlock = ({
  items = [
    {
      __typename: 'ListicleItem',
      richText: mockRichText(),
      image: mockImage(),
      title: 'Foobar'
    },
    {
      __typename: 'ListicleItem',
      richText: mockRichText(),
      image: mockImage(),
      title: 'Bazfoo'
    },
    {
      __typename: 'ListicleItem',
      richText: mockRichText(),
      image: mockImage(),
      title: 'Foobaz'
    }
  ] as ListicleItem[]
}: Partial<ListicleBlock> = {}): ListicleBlock => ({
  type: BlockType.Listicle,
  __typename: 'ListicleBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  items
})

export const mockCommentBlock = ({
  comments = [mockComment(), mockComment(), mockComment()]
}: Partial<CommentBlock> = {}): CommentBlock => ({
  type: BlockType.Comment,
  __typename: 'CommentBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  comments,
  filter: {
    __typename: 'CommentBlockFilter',
    comments: comments.map(({id}) => id),
    tags: []
  }
})

export const mockBildwurfBlock = ({
  zoneID = '77348'
}: Partial<BildwurfAdBlock> = {}): BildwurfAdBlock => ({
  type: BlockType.BildwurfAd,
  __typename: 'BildwurfAdBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  zoneID
})

export const mockFacebookPostBlock = ({
  postID = 'pfbid02JcJeoMg7KasRL8dNjgRJJDFiU8YzeBzEeGeXtqpsE2bnTmeH2y6LRsu7RnmhkPxel',
  userID = 'ladolcekita'
}: Partial<FacebookPostBlock> = {}): FacebookPostBlock => ({
  type: BlockType.FacebookPost,
  __typename: 'FacebookPostBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  postID,
  userID
})

export const mockFacebookVideoBlock = ({
  userID = '100064959061177',
  videoID = '1310370486335266'
}: Partial<FacebookVideoBlock> = {}): FacebookVideoBlock => ({
  type: BlockType.FacebookVideo,
  __typename: 'FacebookVideoBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  userID,
  videoID
})

export const mockInstagramPostBlock = ({
  postID = 'CvACOxxIqT2'
}: Partial<InstagramPostBlock> = {}): InstagramPostBlock => ({
  type: BlockType.InstagramPost,
  __typename: 'InstagramPostBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  postID
})

export const mockTikTokVideoBlock = ({
  userID = 'scout2015',
  videoID = '6718335390845095173'
}: Partial<TikTokVideoBlock> = {}): TikTokVideoBlock => ({
  type: BlockType.TikTokVideo,
  __typename: 'TikTokVideoBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  userID,
  videoID
})

export const mockVimeoVideoBlock = ({
  videoID = '104626862'
}: Partial<VimeoVideoBlock> = {}): VimeoVideoBlock => ({
  type: BlockType.VimeoVideo,
  __typename: 'VimeoVideoBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  videoID
})

export const mockYouTubeVideoBlock = ({
  videoID = 'CCOdQsZa15o'
}: Partial<YouTubeVideoBlock> = {}): YouTubeVideoBlock => ({
  type: BlockType.YouTubeVideo,
  __typename: 'YouTubeVideoBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  videoID
})

export const mockSoundCloudTrackBlock = ({
  trackID = '744469711'
}: Partial<SoundCloudTrackBlock> = {}): SoundCloudTrackBlock => ({
  type: BlockType.SoundCloudTrack,
  __typename: 'SoundCloudTrackBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  trackID
})

export const mockTwitterTweetBlock = ({
  userID = 'WePublish_media',
  tweetID = '1600079498845863937'
}: Partial<TwitterTweetBlock> = {}): TwitterTweetBlock => ({
  type: BlockType.TwitterTweet,
  __typename: 'TwitterTweetBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  tweetID,
  userID
})

export const mockPolisConversationBlock = ({
  conversationID = '744469711'
}: Partial<PolisConversationBlock> = {}): PolisConversationBlock => ({
  type: BlockType.PolisConversation,
  __typename: 'PolisConversationBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  conversationID
})

export const mockIFrameBlock = ({
  url = 'https=/www.example.com',
  title = 'Title',
  width = 560,
  height = 314,
  styleCustom = 'background: #aaa; padding: 50px;',
  sandbox = ''
}: Partial<IFrameBlock> = {}): IFrameBlock => ({
  type: BlockType.Embed,
  __typename: 'IFrameBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  height,
  sandbox,
  styleCustom,
  title,
  url,
  width
})

export const mockImageGalleryBlock = ({
  images = [
    {
      __typename: 'ImageGalleryImage',
      image: mockImage(),
      caption: 'Foobar'
    },
    {
      __typename: 'ImageGalleryImage',
      image: mockImage(),
      caption: 'Bazfoo'
    },
    {
      __typename: 'ImageGalleryImage',
      image: mockImage(),
      caption: 'Foobaz'
    }
  ]
}: Partial<ImageGalleryBlock> = {}): ImageGalleryBlock => ({
  type: BlockType.ImageGallery,
  __typename: 'ImageGalleryBlock',
  blockStyle: undefined,
  blockStyleName: undefined,
  images
})

export const mockPageTeaser = ({
  image = mockImage(),
  lead = 'This is a lead',
  preTitle = 'This is a pretitle',
  title = 'This is a title',
  page = mockPage({latest: mockPageRevision({blocks: []})})
}: Partial<FullPageTeaserFragment> = {}): FullPageTeaserFragment => ({
  __typename: 'PageTeaser',
  type: TeaserType.Page,
  image,
  lead,
  title,
  preTitle,
  page
})

export const mockEventTeaser = ({
  image = mockImage(),
  lead = 'This is a lead',
  preTitle = 'This is a pretitle',
  title = 'This is a title',
  event = mockEvent()
}: Partial<FullEventTeaserFragment> = {}): FullEventTeaserFragment => ({
  __typename: 'EventTeaser',
  type: TeaserType.Event,
  image,
  lead,
  title,
  preTitle,
  event
})

export const mockArticleTeaser = ({
  image = mockImage(),
  lead = 'This is a lead',
  preTitle = 'This is a pretitle',
  title = 'This is a title',
  article = mockArticle({latest: mockArticleRevision({blocks: []})})
}: Partial<FullArticleTeaserFragment> = {}): FullArticleTeaserFragment => ({
  __typename: 'ArticleTeaser',
  type: TeaserType.Article,
  image,
  lead,
  title,
  preTitle,
  article
})

export const mockCustomTeaser = ({
  image = mockImage(),
  lead = 'This is a lead',
  preTitle = 'This is a pretitle',
  title = 'This is a title'
}: Partial<CustomTeaser> = {}): CustomTeaser => ({
  __typename: 'CustomTeaser',
  type: TeaserType.Article,
  image,
  lead,
  title,
  preTitle,
  properties: [],
  contentUrl: 'https://example.com'
})

export const mockTeaserListBlock = ({
  filter = {
    tags: []
  },
  title,
  teasers = [mockArticleTeaser(), mockArticleTeaser(), mockArticleTeaser()]
}: Partial<FullTeaserListBlockFragment> = {}): FullTeaserListBlockFragment => ({
  type: BlockType.TeaserList,
  __typename: 'TeaserListBlock',
  blockStyle: undefined,
  filter,
  title,
  teasers
})

export const mockTeaserGridBlock = ({
  numColumns = 3,
  teasers = [
    mockArticleTeaser(),
    mockPageTeaser(),
    mockEventTeaser(),
    mockCustomTeaser(),
    mockPageTeaser(),
    mockArticleTeaser()
  ]
}: Partial<FullTeaserGridBlockFragment> = {}): FullTeaserGridBlockFragment => ({
  type: BlockType.TeaserList,
  __typename: 'TeaserGridBlock',
  blockStyle: undefined,
  teasers,
  numColumns
})

export const mockFlexAlignment = (props: Omit<FlexAlignment, 'static' | 'i'>): FlexAlignment => ({
  __typename: 'FlexAlignment',
  static: false,
  i: nanoid(),
  ...props
})

export const mockTeaserGridFlexBlock = ({
  flexTeasers = [
    {
      alignment: mockFlexAlignment({
        h: 2,
        w: 4,
        x: 0,
        y: 0
      }),
      teaser: mockArticleTeaser()
    },
    {
      alignment: mockFlexAlignment({
        h: 2,
        w: 4,
        x: 0,
        y: 2
      }),
      teaser: mockArticleTeaser()
    },
    {
      alignment: mockFlexAlignment({
        h: 4,
        w: 8,
        x: 4,
        y: 0
      }),
      teaser: mockArticleTeaser()
    }
  ]
}: Partial<FullTeaserGridFlexBlockFragment> = {}): FullTeaserGridFlexBlockFragment => ({
  type: BlockType.TeaserList,
  __typename: 'TeaserGridFlexBlock',
  blockStyle: undefined,
  flexTeasers
})

export const mockBlockContent = ({
  title = mockTitleBlock(),
  image = mockImageBlock(),
  richtext = mockRichTextBlock(),
  quote = mockQuoteBlock(),
  poll = mockPollBlock(),
  breakb = mockBreakBlock(),
  event = mockEventBlock(),
  html = mockHTMLBlock(),
  listicle = mockListicleBlock(),
  comment = mockCommentBlock(),
  bildwurf = mockBildwurfBlock(),
  facebookPost = mockFacebookPostBlock(),
  facebookVideo = mockFacebookVideoBlock(),
  instagramPost = mockInstagramPostBlock(),
  tiktokVideo = mockTikTokVideoBlock(),
  youtubeVideo = mockYouTubeVideoBlock(),
  soundCloud = mockSoundCloudTrackBlock(),
  twitter = mockTwitterTweetBlock(),
  polisConversation = mockPolisConversationBlock(),
  iframe = mockIFrameBlock(),
  imageGallery = mockImageGalleryBlock(),
  teaserList = mockTeaserListBlock(),
  col6 = mockTeaserGridBlock(),
  col1 = mockTeaserGridBlock({numColumns: 1, teasers: [mockEventTeaser()]}),
  flex = mockTeaserGridFlexBlock()
} = {}) =>
  [
    title,
    image,
    richtext,
    quote,
    poll,
    breakb,
    listicle,
    event,
    html,
    comment,
    bildwurf,
    facebookPost,
    facebookVideo,
    instagramPost,
    tiktokVideo,
    youtubeVideo,
    soundCloud,
    twitter,
    polisConversation,
    iframe,
    imageGallery,
    teaserList,
    col6,
    col1,
    flex
  ].filter(block => !!block) as FullBlockFragment[]
