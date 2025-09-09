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
  FlexAlignment,
  CrowdfundingBlock
} from '@wepublish/website/api'
import {mockImage} from './image'
import {mockRichText} from './richtext'
import {mockPoll} from './poll'
import {mockEvent} from './event'
import {mockComment} from './comment'
import {mockArticle, mockArticleRevision} from './article'
import {mockPage, mockPageRevision} from './page'
import nanoid from 'nanoid'
import {mockCrowdfunding} from './crowdfunding'

export const mockTitleBlock = ({
  title = 'Title Block',
  lead = 'Lead',
  preTitle = 'Pre-Title'
}: Partial<TitleBlock> = {}): TitleBlock => ({
  type: BlockType.Title,
  __typename: 'TitleBlock',
  blockStyle: null,
  blockStyleName: null,
  lead,
  title,
  preTitle
})

export const mockImageBlock = ({
  image = mockImage(),
  linkUrl = null
}: Partial<ImageBlock> = {}): ImageBlock => ({
  type: BlockType.Image,
  __typename: 'ImageBlock',
  blockStyle: null,
  blockStyleName: null,
  caption: 'Caption',
  image,
  imageID: image?.id,
  linkUrl
})

export const mockRichTextBlock = ({
  richText = mockRichText()
}: Partial<RichTextBlock> = {}): RichTextBlock => ({
  type: BlockType.RichText,
  __typename: 'RichTextBlock',
  blockStyle: null,
  blockStyleName: null,
  richText
})

export const mockQuoteBlock = ({
  image = mockImage(),
  author = 'John Doe',
  quote = 'This is a quote that is very long so that we can make sure that linebreaks correctly happen.'
}: Partial<QuoteBlock> = {}): QuoteBlock => ({
  type: BlockType.Quote,
  __typename: 'QuoteBlock',
  blockStyle: null,
  blockStyleName: null,
  quote,
  author,
  image,
  imageID: image?.id
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
  blockStyle: null,
  blockStyleName: null,
  richText,
  hideButton,
  image,
  imageID: image?.id,
  linkTarget,
  linkText,
  linkURL,
  text
})

export const mockPollBlock = ({poll = mockPoll()}: Partial<PollBlock> = {}): PollBlock => ({
  type: BlockType.Poll,
  __typename: 'PollBlock',
  blockStyle: null,
  blockStyleName: null,
  poll
})

export const mockEventBlock = ({
  events = [mockEvent(), mockEvent(), mockEvent(), mockEvent(), mockEvent(), mockEvent()]
}: Partial<EventBlock> = {}): EventBlock => ({
  type: BlockType.Event,
  __typename: 'EventBlock',
  blockStyle: null,
  blockStyleName: null,
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
  blockStyle: null,
  blockStyleName: null,
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
  blockStyle: null,
  blockStyleName: null,
  items
})

export const mockCommentBlock = ({
  comments = [mockComment(), mockComment(), mockComment()]
}: Partial<CommentBlock> = {}): CommentBlock => ({
  type: BlockType.Comment,
  __typename: 'CommentBlock',
  blockStyle: null,
  blockStyleName: null,
  comments,
  filter: {
    __typename: 'CommentBlockFilter',
    comments: comments.map(({id}) => id),
    tags: []
  }
})

export const mockCrowdfundingBlock = ({
  crowdfunding = mockCrowdfunding()
}: Partial<CrowdfundingBlock> = {}) => ({
  type: BlockType.Crowdfunding,
  __typename: 'CrowdfundingBlock',
  blockStyle: null,
  blockStyleName: null,
  crowdfunding
})

export const mockBildwurfBlock = ({
  zoneID = '77348'
}: Partial<BildwurfAdBlock> = {}): BildwurfAdBlock => ({
  type: BlockType.BildwurfAd,
  __typename: 'BildwurfAdBlock',
  blockStyle: null,
  blockStyleName: null,
  zoneID
})

export const mockFacebookPostBlock = ({
  postID = 'pfbid02JcJeoMg7KasRL8dNjgRJJDFiU8YzeBzEeGeXtqpsE2bnTmeH2y6LRsu7RnmhkPxel',
  userID = 'ladolcekita'
}: Partial<FacebookPostBlock> = {}): FacebookPostBlock => ({
  type: BlockType.FacebookPost,
  __typename: 'FacebookPostBlock',
  blockStyle: null,
  blockStyleName: null,
  postID,
  userID
})

export const mockFacebookVideoBlock = ({
  userID = '100064959061177',
  videoID = '1310370486335266'
}: Partial<FacebookVideoBlock> = {}): FacebookVideoBlock => ({
  type: BlockType.FacebookVideo,
  __typename: 'FacebookVideoBlock',
  blockStyle: null,
  blockStyleName: null,
  userID,
  videoID
})

export const mockInstagramPostBlock = ({
  postID = 'CvACOxxIqT2'
}: Partial<InstagramPostBlock> = {}): InstagramPostBlock => ({
  type: BlockType.InstagramPost,
  __typename: 'InstagramPostBlock',
  blockStyle: null,
  blockStyleName: null,
  postID
})

export const mockTikTokVideoBlock = ({
  userID = 'scout2015',
  videoID = '6718335390845095173'
}: Partial<TikTokVideoBlock> = {}): TikTokVideoBlock => ({
  type: BlockType.TikTokVideo,
  __typename: 'TikTokVideoBlock',
  blockStyle: null,
  blockStyleName: null,
  userID,
  videoID
})

export const mockVimeoVideoBlock = ({
  videoID = '104626862'
}: Partial<VimeoVideoBlock> = {}): VimeoVideoBlock => ({
  type: BlockType.VimeoVideo,
  __typename: 'VimeoVideoBlock',
  blockStyle: null,
  blockStyleName: null,
  videoID
})

export const mockYouTubeVideoBlock = ({
  videoID = 'CCOdQsZa15o'
}: Partial<YouTubeVideoBlock> = {}): YouTubeVideoBlock => ({
  type: BlockType.YouTubeVideo,
  __typename: 'YouTubeVideoBlock',
  blockStyle: null,
  blockStyleName: null,
  videoID
})

export const mockSoundCloudTrackBlock = ({
  trackID = '744469711'
}: Partial<SoundCloudTrackBlock> = {}): SoundCloudTrackBlock => ({
  type: BlockType.SoundCloudTrack,
  __typename: 'SoundCloudTrackBlock',
  blockStyle: null,
  blockStyleName: null,
  trackID
})

export const mockTwitterTweetBlock = ({
  userID = 'WePublish_media',
  tweetID = '1600079498845863937'
}: Partial<TwitterTweetBlock> = {}): TwitterTweetBlock => ({
  type: BlockType.TwitterTweet,
  __typename: 'TwitterTweetBlock',
  blockStyle: null,
  blockStyleName: null,
  tweetID,
  userID
})

export const mockPolisConversationBlock = ({
  conversationID = '744469711'
}: Partial<PolisConversationBlock> = {}): PolisConversationBlock => ({
  type: BlockType.PolisConversation,
  __typename: 'PolisConversationBlock',
  blockStyle: null,
  blockStyleName: null,
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
  blockStyle: null,
  blockStyleName: null,
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
  blockStyle: null,
  blockStyleName: null,
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
  imageID: image?.id,
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
  title = null,
  teasers = [mockArticleTeaser(), mockArticleTeaser(), mockArticleTeaser()]
}: Partial<FullTeaserListBlockFragment> = {}): FullTeaserListBlockFragment => ({
  type: BlockType.TeaserList,
  __typename: 'TeaserListBlock',
  blockStyle: null,
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
  ],
  blockStyle
}: Partial<FullTeaserGridBlockFragment> = {}): FullTeaserGridBlockFragment => ({
  type: BlockType.TeaserList,
  __typename: 'TeaserGridBlock',
  blockStyle,
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
  type: BlockType.TeaserGridFlex,
  __typename: 'TeaserGridFlexBlock',
  blockStyle: null,
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
