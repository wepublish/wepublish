import {
  BlockType,
  FullArticleTeaserFragment,
  FullBildwurfAdBlockFragment,
  FullBlockFragment,
  FullBlockTemplateBlockFragment,
  FullBreakBlockFragment,
  FullCommentBlockFragment,
  FullCrowdfundingBlockFragment,
  FullEventBlockFragment,
  FullEventTeaserFragment,
  FullFacebookPostBlockFragment,
  FullFacebookVideoBlockFragment,
  FullFlexAlignmentFragment,
  FullFlexBlockFragment,
  FullFlexTeaserFragment,
  FullHtmlBlockFragment,
  FullIFrameBlockFragment,
  FullImageBlockFragment,
  FullImageGalleryBlockFragment,
  FullInstagramPostBlockFragment,
  FullListicleBlockFragment,
  FullMailchimpFormBlockFragment,
  FullPageTeaserFragment,
  FullPolisConversationBlockFragment,
  FullPollBlockFragment,
  FullQuoteBlockFragment,
  FullRichTextBlockFragment,
  FullSoundCloudTrackBlockFragment,
  FullStreamableVideoBlockFragment,
  FullSubscribeBlockFragment,
  FullTeaserGridBlockFragment,
  FullTeaserGridFlexBlockFragment,
  FullTeaserListBlockFragment,
  FullTeaserSlotsBlockFragment,
  FullTikTokVideoBlockFragment,
  FullTitleBlockFragment,
  FullTwitterTweetBlockFragment,
  FullVimeoVideoBlockFragment,
  FullYouTubeVideoBlockFragment,
  MailchimpFormOptionsLayout,
  PaymentPeriodicity,
  SubscribeBlockRenderLayout,
  TeaserType,
} from '@wepublish/website/api';
import { mockImage } from './image';
import { mockRichText } from './richtext';
import { mockPoll } from './poll';
import { mockEvent } from './event';
import { mockComment } from './comment';
import { mockArticle, mockArticleRevision } from './article';
import { mockPage, mockPageRevision } from './page';
import { mockCrowdfunding } from './crowdfunding';
import { mockMemberPlan, mockPeriodicityPrice } from './membership';
import { faker } from './faker';
import { definedOnly } from './overrides';

type Teaser = NonNullable<FullTeaserListBlockFragment['teasers'][number]>;
type CustomTeaserFragment = Extract<Teaser, { __typename: 'CustomTeaser' }>;
type ListicleItem = FullListicleBlockFragment['items'][number];
type ImageGalleryImage = FullImageGalleryBlockFragment['images'][number];
type BlockWithAlignment = FullFlexBlockFragment['blocks'][number];
type BlockTemplate = NonNullable<FullBlockTemplateBlockFragment['template']>;
type SubscribeBlockRenderSetting =
  FullSubscribeBlockFragment['memberPlanRenderSettings'][number];
type MailchimpFormStep = FullMailchimpFormBlockFragment['steps'][number];
type MailchimpFormFieldConfig = MailchimpFormStep['inputs'][number];
type MailchimpFormInterestOption = MailchimpFormFieldConfig['options'][number];

export const mockTitleBlock = (
  overrides: Partial<FullTitleBlockFragment> = {}
): FullTitleBlockFragment => ({
  __typename: 'TitleBlock',
  blockStyle: null,
  title: 'Title Block',
  lead: 'Lead',
  preTitle: 'Pre-Title',
  ...definedOnly(overrides),
});

export const mockImageBlock = ({
  image = mockImage(),
  ...overrides
}: Partial<FullImageBlockFragment> = {}): FullImageBlockFragment => ({
  __typename: 'ImageBlock',
  blockStyle: null,
  caption: 'Caption',
  linkUrl: null,
  image,
  ...definedOnly(overrides),
});

export const mockRichTextBlock = ({
  richText = mockRichText(),
  ...overrides
}: Partial<FullRichTextBlockFragment> = {}): FullRichTextBlockFragment => ({
  __typename: 'RichTextBlock',
  blockStyle: null,
  richText,
  ...definedOnly(overrides),
});

export const mockQuoteBlock = ({
  image = mockImage(),
  ...overrides
}: Partial<FullQuoteBlockFragment> = {}): FullQuoteBlockFragment => ({
  __typename: 'QuoteBlock',
  blockStyle: null,
  quote:
    'This is a quote that is very long so that we can make sure that linebreaks correctly happen.',
  author: 'John Doe',
  image,
  ...definedOnly(overrides),
});

export const mockBreakBlock = ({
  image = mockImage(),
  richText = mockRichText(),
  ...overrides
}: Partial<FullBreakBlockFragment> = {}): FullBreakBlockFragment => ({
  __typename: 'BreakBlock',
  blockStyle: null,
  hideButton: true,
  linkTarget: '_blank',
  linkText: 'Button Text',
  linkURL: 'https://example.com',
  text: 'Foobar',
  richText,
  image,
  ...definedOnly(overrides),
});

export const mockPollBlock = ({
  poll = mockPoll(),
  ...overrides
}: Partial<FullPollBlockFragment> = {}): FullPollBlockFragment => ({
  __typename: 'PollBlock',
  blockStyle: null,
  poll,
  ...definedOnly(overrides),
});

export const mockEventBlock = ({
  events = [
    mockEvent(),
    mockEvent(),
    mockEvent(),
    mockEvent(),
    mockEvent(),
    mockEvent(),
  ],
  ...overrides
}: Partial<FullEventBlockFragment> = {}): FullEventBlockFragment => ({
  __typename: 'EventBlock',
  blockStyle: null,
  events,
  ...definedOnly(overrides),
});

export const mockHTMLBlock = (
  overrides: Partial<FullHtmlBlockFragment> = {}
): FullHtmlBlockFragment => ({
  __typename: 'HTMLBlock',
  blockStyle: null,
  html: `<script>
    window.__niceDiv = document.createElement("div");
    with(window.__niceDiv.style) {
      width = '100%';
      height = '100px';
      border = '2px solid red';
      display = 'flex';
      alignItems = 'center';
      justifyContent = 'center';
      fontSize = '20px';
      fontWeight = 'bold';
      margin = '2rem 0';
    };
    window.__niceDiv.innerText = "This is a nice <HTML block />";
    (function(script) {
      script.parentNode.appendChild(window.__niceDiv);
  })(document.currentScript);
 </script>`,
  ...definedOnly(overrides),
});

export const mockListicleItem = ({
  richText = mockRichText(),
  image = mockImage(),
  ...overrides
}: Partial<ListicleItem> = {}): ListicleItem => ({
  __typename: 'ListicleItem',
  title: 'Foobar',
  richText,
  image,
  ...definedOnly(overrides),
});

export const mockListicleBlock = ({
  items = [
    mockListicleItem({ title: 'Foobar' }),
    mockListicleItem({ title: 'Bazfoo' }),
    mockListicleItem({ title: 'Foobaz' }),
  ],
  ...overrides
}: Partial<FullListicleBlockFragment> = {}): FullListicleBlockFragment => ({
  __typename: 'ListicleBlock',
  blockStyle: null,
  items,
  ...definedOnly(overrides),
});

export const mockCommentBlock = ({
  comments = [mockComment(), mockComment(), mockComment()],
  ...overrides
}: Partial<FullCommentBlockFragment> = {}): FullCommentBlockFragment => ({
  __typename: 'CommentBlock',
  blockStyle: null,
  comments,
  ...definedOnly(overrides),
});

export const mockCrowdfundingBlock = ({
  crowdfunding = mockCrowdfunding(),
  ...overrides
}: Partial<FullCrowdfundingBlockFragment> = {}): FullCrowdfundingBlockFragment => ({
  __typename: 'CrowdfundingBlock',
  blockStyle: null,
  crowdfunding,
  ...definedOnly(overrides),
});

export const mockBildwurfBlock = (
  overrides: Partial<FullBildwurfAdBlockFragment> = {}
): FullBildwurfAdBlockFragment => ({
  __typename: 'BildwurfAdBlock',
  blockStyle: null,
  zoneID: '77348',
  ...definedOnly(overrides),
});

export const mockFacebookPostBlock = (
  overrides: Partial<FullFacebookPostBlockFragment> = {}
): FullFacebookPostBlockFragment => ({
  __typename: 'FacebookPostBlock',
  blockStyle: null,
  postID:
    'pfbid02JcJeoMg7KasRL8dNjgRJJDFiU8YzeBzEeGeXtqpsE2bnTmeH2y6LRsu7RnmhkPxel',
  userID: 'ladolcekita',
  ...definedOnly(overrides),
});

export const mockFacebookVideoBlock = (
  overrides: Partial<FullFacebookVideoBlockFragment> = {}
): FullFacebookVideoBlockFragment => ({
  __typename: 'FacebookVideoBlock',
  blockStyle: null,
  userID: '100064959061177',
  videoID: '1310370486335266',
  ...definedOnly(overrides),
});

export const mockInstagramPostBlock = (
  overrides: Partial<FullInstagramPostBlockFragment> = {}
): FullInstagramPostBlockFragment => ({
  __typename: 'InstagramPostBlock',
  blockStyle: null,
  postID: 'CvACOxxIqT2',
  ...definedOnly(overrides),
});

export const mockTikTokVideoBlock = (
  overrides: Partial<FullTikTokVideoBlockFragment> = {}
): FullTikTokVideoBlockFragment => ({
  __typename: 'TikTokVideoBlock',
  blockStyle: null,
  userID: 'scout2015',
  videoID: '6718335390845095173',
  ...definedOnly(overrides),
});

export const mockVimeoVideoBlock = (
  overrides: Partial<FullVimeoVideoBlockFragment> = {}
): FullVimeoVideoBlockFragment => ({
  __typename: 'VimeoVideoBlock',
  blockStyle: null,
  videoID: '104626862',
  ...definedOnly(overrides),
});

export const mockStreamableVideoBlock = (
  overrides: Partial<FullStreamableVideoBlockFragment> = {}
): FullStreamableVideoBlockFragment => ({
  __typename: 'StreamableVideoBlock',
  blockStyle: null,
  videoID: 'abc123',
  ...definedOnly(overrides),
});

export const mockYouTubeVideoBlock = (
  overrides: Partial<FullYouTubeVideoBlockFragment> = {}
): FullYouTubeVideoBlockFragment => ({
  __typename: 'YouTubeVideoBlock',
  blockStyle: null,
  videoID: 'CCOdQsZa15o',
  ...definedOnly(overrides),
});

export const mockSoundCloudTrackBlock = (
  overrides: Partial<FullSoundCloudTrackBlockFragment> = {}
): FullSoundCloudTrackBlockFragment => ({
  __typename: 'SoundCloudTrackBlock',
  blockStyle: null,
  trackID: '744469711',
  ...definedOnly(overrides),
});

export const mockTwitterTweetBlock = (
  overrides: Partial<FullTwitterTweetBlockFragment> = {}
): FullTwitterTweetBlockFragment => ({
  __typename: 'TwitterTweetBlock',
  blockStyle: null,
  userID: 'WePublish_media',
  tweetID: '1600079498845863937',
  ...definedOnly(overrides),
});

export const mockPolisConversationBlock = (
  overrides: Partial<FullPolisConversationBlockFragment> = {}
): FullPolisConversationBlockFragment => ({
  __typename: 'PolisConversationBlock',
  blockStyle: null,
  conversationID: '744469711',
  ...definedOnly(overrides),
});

export const mockIFrameBlock = (
  overrides: Partial<FullIFrameBlockFragment> = {}
): FullIFrameBlockFragment => ({
  __typename: 'IFrameBlock',
  blockStyle: null,
  url: 'https://www.example.com',
  title: 'Title',
  width: 560,
  height: 314,
  styleCustom: 'background: #aaa; padding: 50px;',
  sandbox: '',
  ...definedOnly(overrides),
});

export const mockImageGalleryImage = ({
  image = mockImage(),
  ...overrides
}: Partial<ImageGalleryImage> = {}): ImageGalleryImage => ({
  __typename: 'ImageGalleryImage',
  caption: 'Foobar',
  image,
  ...definedOnly(overrides),
});

export const mockImageGalleryBlock = ({
  images = [
    mockImageGalleryImage({ caption: 'Foobar' }),
    mockImageGalleryImage({ caption: 'Bazfoo' }),
    mockImageGalleryImage({ caption: 'Foobaz' }),
  ],
  ...overrides
}: Partial<FullImageGalleryBlockFragment> = {}): FullImageGalleryBlockFragment => ({
  __typename: 'ImageGalleryBlock',
  blockStyle: null,
  images,
  ...definedOnly(overrides),
});

export const mockPageTeaser = ({
  image = mockImage(),
  page = mockPage({ latest: mockPageRevision({ blocks: [] }) }),
  ...overrides
}: Partial<FullPageTeaserFragment> = {}): FullPageTeaserFragment => ({
  __typename: 'PageTeaser',
  type: TeaserType.Page,
  lead: 'This is a lead',
  preTitle: 'This is a pretitle',
  title: 'This is a title',
  image,
  page,
  ...definedOnly(overrides),
});

export const mockEventTeaser = ({
  image = mockImage(),
  event = mockEvent(),
  ...overrides
}: Partial<FullEventTeaserFragment> = {}): FullEventTeaserFragment => ({
  __typename: 'EventTeaser',
  type: TeaserType.Event,
  lead: 'This is a lead',
  preTitle: 'This is a pretitle',
  title: 'This is a title',
  image,
  event,
  ...definedOnly(overrides),
});

export const mockArticleTeaser = ({
  image = mockImage(),
  article = mockArticle({ latest: mockArticleRevision({ blocks: [] }) }),
  ...overrides
}: Partial<FullArticleTeaserFragment> = {}): FullArticleTeaserFragment => ({
  __typename: 'ArticleTeaser',
  type: TeaserType.Article,
  lead: 'This is a lead',
  preTitle: 'This is a pretitle',
  title: 'This is a title',
  image,
  article,
  ...definedOnly(overrides),
});

export const mockCustomTeaser = ({
  image = mockImage(),
  ...overrides
}: Partial<CustomTeaserFragment> = {}): CustomTeaserFragment => ({
  __typename: 'CustomTeaser',
  type: TeaserType.Custom,
  lead: 'This is a lead',
  preTitle: 'This is a pretitle',
  title: 'This is a title',
  contentUrl: 'https://example.com',
  openInNewTab: false,
  properties: [],
  image,
  ...definedOnly(overrides),
});

export const mockTeaserListBlock = ({
  teasers = [mockArticleTeaser(), mockArticleTeaser(), mockArticleTeaser()],
  ...overrides
}: Partial<FullTeaserListBlockFragment> = {}): FullTeaserListBlockFragment => ({
  __typename: 'TeaserListBlock',
  type: BlockType.TeaserList,
  blockStyle: null,
  title: null,
  filter: {
    __typename: 'TeaserListBlockFilter',
    tags: [],
  },
  teasers,
  ...definedOnly(overrides),
});

export const mockTeaserGridBlock = ({
  teasers = [
    mockArticleTeaser(),
    mockPageTeaser(),
    mockEventTeaser(),
    mockCustomTeaser(),
    mockPageTeaser(),
    mockArticleTeaser(),
  ],
  ...overrides
}: Partial<FullTeaserGridBlockFragment> = {}): FullTeaserGridBlockFragment => ({
  __typename: 'TeaserGridBlock',
  type: BlockType.TeaserGrid,
  blockStyle: null,
  title: null,
  numColumns: 3,
  teasers,
  ...definedOnly(overrides),
});

export const mockTeaserSlotsBlock = ({
  teasers = [
    mockArticleTeaser(),
    mockArticleTeaser(),
    mockArticleTeaser(),
    mockArticleTeaser(),
    mockArticleTeaser(),
    mockArticleTeaser(),
    mockCustomTeaser({ preTitle: 'More about this topic' }),
  ],
  ...overrides
}: Partial<FullTeaserSlotsBlockFragment> = {}): FullTeaserSlotsBlockFragment => ({
  __typename: 'TeaserSlotsBlock',
  type: BlockType.TeaserSlots,
  blockStyle: null,
  title: 'test title',
  teasers,
  ...definedOnly(overrides),
});

export const mockFlexAlignment = (
  overrides: Partial<FullFlexAlignmentFragment> = {}
): FullFlexAlignmentFragment => ({
  __typename: 'FlexAlignment',
  i: faker.string.nanoid(),
  x: 0,
  y: 0,
  w: 4,
  h: 2,
  ...definedOnly(overrides),
});

export const mockFlexTeaser = ({
  alignment = mockFlexAlignment(),
  teaser = mockArticleTeaser(),
  ...overrides
}: Partial<FullFlexTeaserFragment> = {}): FullFlexTeaserFragment => ({
  __typename: 'FlexTeaser',
  alignment,
  teaser,
  ...definedOnly(overrides),
});

export const mockTeaserGridFlexBlock = ({
  flexTeasers = [
    mockFlexTeaser({
      alignment: mockFlexAlignment({ h: 2, w: 4, x: 0, y: 0 }),
    }),
    mockFlexTeaser({
      alignment: mockFlexAlignment({ h: 2, w: 4, x: 0, y: 2 }),
    }),
    mockFlexTeaser({
      alignment: mockFlexAlignment({ h: 4, w: 8, x: 4, y: 0 }),
    }),
  ],
  ...overrides
}: Partial<FullTeaserGridFlexBlockFragment> = {}): FullTeaserGridFlexBlockFragment => ({
  __typename: 'TeaserGridFlexBlock',
  type: BlockType.TeaserGridFlex,
  blockStyle: null,
  title: null,
  flexTeasers,
  ...definedOnly(overrides),
});

export const mockBlockWithAlignment = ({
  alignment = mockFlexAlignment(),
  block = mockTitleBlock(),
  ...overrides
}: Partial<BlockWithAlignment> = {}): BlockWithAlignment => ({
  __typename: 'BlockWithAlignment',
  alignment,
  block,
  ...definedOnly(overrides),
});

export const mockFlexBlock = ({
  blocks = [
    mockBlockWithAlignment({
      alignment: mockFlexAlignment({ h: 1, w: 12, x: 0, y: 0 }),
      block: mockTitleBlock(),
    }),
    mockBlockWithAlignment({
      alignment: mockFlexAlignment({ h: 4, w: 6, x: 0, y: 1 }),
      block: mockImageBlock(),
    }),
    mockBlockWithAlignment({
      alignment: mockFlexAlignment({ h: 4, w: 6, x: 6, y: 1 }),
      block: mockRichTextBlock(),
    }),
  ],
  ...overrides
}: Partial<FullFlexBlockFragment> = {}): FullFlexBlockFragment => ({
  __typename: 'FlexBlock',
  type: BlockType.FlexBlock,
  blockStyle: null,
  blocks,
  ...definedOnly(overrides),
});

export const mockSubscribeBlockRenderSetting = (
  overrides: Partial<SubscribeBlockRenderSetting> = {}
): SubscribeBlockRenderSetting => ({
  __typename: 'SubscribeBlockMemberPlanRenderSetting',
  memberPlanId: faker.string.nanoid(),
  isDefault: false,
  layout: {
    __typename: 'SubscribeBlockLayoutNoneConfig',
    type: SubscribeBlockRenderLayout.None,
    showInput: false,
  },
  ...definedOnly(overrides),
});

export const mockSubscribeBlock = ({
  memberPlans = [
    mockMemberPlan(),
    mockMemberPlan({
      periodicityPricing: [
        mockPeriodicityPrice({
          periodicity: PaymentPeriodicity.Monthly,
          amountMin: 10000,
          amountTarget: 15000,
          amountMax: null,
        }),
      ],
    }),
  ],
  memberPlanIds = memberPlans.map(({ id }) => id),
  memberPlanRenderSettings = memberPlanIds.map((memberPlanId, index) =>
    mockSubscribeBlockRenderSetting({ memberPlanId, isDefault: index === 0 })
  ),
  ...overrides
}: Partial<FullSubscribeBlockFragment> = {}): FullSubscribeBlockFragment => ({
  __typename: 'SubscribeBlock',
  blockStyle: null,
  fields: [],
  periodicityDisplay: null,
  showGoodies: false,
  showDiscountCodes: false,
  goodieMinValue: null,
  goodieMinValueAppliesToUpgrade: false,
  hideRepeatGoodieOnUpgrade: false,
  memberPlans,
  memberPlanIds,
  memberPlanRenderSettings,
  ...definedOnly(overrides),
});

export const mockMailchimpFormInterestOption = ({
  image = mockImage(),
  ...overrides
}: Partial<MailchimpFormInterestOption> = {}): MailchimpFormInterestOption => ({
  __typename: 'MailchimpFormInterestOption',
  id: faker.string.nanoid(),
  name: 'Daily Briefing',
  description: 'The most important news every morning.',
  image,
  ...definedOnly(overrides),
});

export const mockMailchimpFormFieldConfig = (
  overrides: Partial<MailchimpFormFieldConfig> = {}
): MailchimpFormFieldConfig => ({
  __typename: 'MailchimpFormFieldConfig',
  inputType: 'email',
  name: 'EMAIL',
  label: 'Email',
  description: null,
  required: true,
  urlParam: null,
  defaultValue: null,
  value: null,
  optionsLayout: MailchimpFormOptionsLayout.List,
  options: [],
  ...definedOnly(overrides),
});

export const mockMailchimpFormStep = ({
  inputs = [mockMailchimpFormFieldConfig()],
  ...overrides
}: Partial<MailchimpFormStep> = {}): MailchimpFormStep => ({
  __typename: 'MailchimpFormStep',
  skipIfFieldsFilled: [],
  skipIfInterestsFilled: [],
  showIfInterestsFilled: [],
  inputs,
  ...definedOnly(overrides),
});

export const mockMailchimpFormBlock = ({
  steps = [mockMailchimpFormStep()],
  ...overrides
}: Partial<FullMailchimpFormBlockFragment> = {}): FullMailchimpFormBlockFragment => ({
  __typename: 'MailchimpFormBlock',
  blockStyle: null,
  syncProviderId: 'sync-provider',
  listId: 'list-daily',
  interests: [],
  autoFocus: false,
  doubleOptIn: true,
  buttonColor: null,
  buttonFontColor: null,
  submitButtonLabel: null,
  successUrl: null,
  successPage: null,
  steps,
  ...definedOnly(overrides),
});

export const mockMailchimpFormInterestsInput = (
  input: Partial<MailchimpFormFieldConfig> = {}
): MailchimpFormFieldConfig =>
  mockMailchimpFormFieldConfig({
    inputType: 'groups',
    name: null,
    label: 'Newsletters',
    required: false,
    options: [
      mockMailchimpFormInterestOption({ id: 'interest-daily' }),
      mockMailchimpFormInterestOption({
        id: 'interest-weekly',
        name: 'Weekly Culture',
        description: 'Exhibitions, concerts and books of the week.',
      }),
      mockMailchimpFormInterestOption({
        id: 'interest-local',
        name: 'Local News',
        description: null,
        image: null,
      }),
    ],
    ...input,
  });

export const mockInterestsMailchimpFormBlock = (
  block: Partial<FullMailchimpFormBlockFragment> = {},
  interestsInput: Partial<MailchimpFormFieldConfig> = {}
): FullMailchimpFormBlockFragment =>
  mockMailchimpFormBlock({
    steps: [
      mockMailchimpFormStep({
        inputs: [
          mockMailchimpFormFieldConfig(),
          mockMailchimpFormInterestsInput(interestsInput),
        ],
      }),
    ],
    ...block,
  });

export type MockTabbedContent = (
  overrides?: Partial<FullFlexBlockFragment>
) => FullFlexBlockFragment;

export const mockTabbedContentTeaserSlots: MockTabbedContent = ({
  blocks = [
    'First Tab',
    'Second Tab',
    'Third Tab',
    'Fourth Tab',
    'Fifth Tab',
    'Sixth Tab',
  ].map(title =>
    mockBlockWithAlignment({
      alignment: mockFlexAlignment({ h: 0, w: 0, x: 0, y: 0 }),
      block: mockTeaserSlotsBlock({ title }),
    })
  ),
  ...overrides
} = {}) =>
  mockFlexBlock({
    blockStyle: 'TabbedContent',
    blocks,
    ...overrides,
  });

export const mockBlockTemplate = ({
  blocks = [mockTitleBlock(), mockRichTextBlock()],
  ...overrides
}: Partial<BlockTemplate> = {}): BlockTemplate => ({
  __typename: 'BlockTemplate',
  id: '1234-1234',
  name: 'Block Template',
  blocks,
  ...definedOnly(overrides),
});

export const mockBlockTemplateBlock = ({
  templateId = '1234-1234',
  template = mockBlockTemplate({ id: templateId }),
  ...overrides
}: Partial<FullBlockTemplateBlockFragment> = {}): FullBlockTemplateBlockFragment => ({
  __typename: 'BlockTemplateBlock',
  type: BlockType.BlockTemplate,
  blockStyle: null,
  templateId,
  template,
  ...definedOnly(overrides),
});

type BlockContentOverrides = Partial<
  Record<
    | 'title'
    | 'image'
    | 'richtext'
    | 'quote'
    | 'poll'
    | 'breakb'
    | 'event'
    | 'html'
    | 'listicle'
    | 'comment'
    | 'bildwurf'
    | 'facebookPost'
    | 'facebookVideo'
    | 'instagramPost'
    | 'tiktokVideo'
    | 'youtubeVideo'
    | 'soundCloud'
    | 'twitter'
    | 'polisConversation'
    | 'iframe'
    | 'imageGallery'
    | 'teaserList'
    | 'col6'
    | 'col1'
    | 'flex'
    | 'slots',
    FullBlockFragment | null
  >
>;

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
  col1 = mockTeaserGridBlock({ numColumns: 1, teasers: [mockEventTeaser()] }),
  flex = mockTeaserGridFlexBlock(),
  slots = mockTeaserSlotsBlock(),
}: BlockContentOverrides = {}): FullBlockFragment[] =>
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
    flex,
    slots,
  ].filter((block): block is FullBlockFragment => !!block);
