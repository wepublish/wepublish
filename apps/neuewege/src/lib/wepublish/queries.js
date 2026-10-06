// we.publish website-API documents used by the data adapter.

// The six Drupal image styles (DEFAULTS … DEFAULTXXXL) the components expect,
// mapped to the nearest widths the we.publish media server allows (Drupal:
// 640/960/1280/1440/1920/2560; allowed: 200 300 500 800 1000 1200 1500 2400 —
// libs/media-transform-guard). The browser picks from the srcset; layout
// only depends on the xxxl aspect ratio, which is computed exactly.
export const IMAGE_WIDTHS = {
  style_s: 500,
  style_m: 800,
  style_l: 1200,
  style_xl: 1500,
  style_xxl: 1500,
  style_xxxl: 2400,
};

const IMAGE = `
  id width height url title description
  ${Object.entries(IMAGE_WIDTHS)
    .map(
      ([alias, width]) => `${alias}: transformURL(input: { width: ${width} })`
    )
    .join('\n  ')}
`;

// Everything the /abos form (components/subscribe-form.js) is built from:
// the block's configuration and its member plans. Prices only come from
// `periodicityPricing` — the `amountPerMonth*` fields are gone since
// we.publish #3037.
const SUBSCRIBE_BLOCK = `
  blockStyleName disabled fields periodicityDisplay showDiscountCodes showGoodies goodieMinValue
  memberPlanRenderSettings {
    memberPlanId isDefault
    layout {
      type
      ... on SubscribeBlockLayoutPickerConfig { showInput values }
      ... on SubscribeBlockLayoutSliderConfig { showInput }
    }
  }
  memberPlans {
    id slug name currency extendable productType
    defaultPaymentPeriodicity
    shortDescription
    successPage { slug }
    failPage { slug }
    periodicityPricing { periodicity amountMin amountTarget amountMax label }
    availablePaymentMethods { paymentPeriodicities forceAutoRenewal paymentMethods { id slug name paymentProviderID } }
    goodies { id name }
  }
`;

const LEAF_BLOCK = `
  __typename
  ... on RichTextBlock { blockStyleName richText }
  ... on HTMLBlock { html }
  ... on QuoteBlock { quote }
  ... on TitleBlock { title lead }
  ... on ImageBlock { caption image { ${IMAGE} } }
  ... on ImageGalleryBlock { images { caption image { ${IMAGE} } } }
  ... on SubscribeBlock { ${SUBSCRIBE_BLOCK} }
  ... on EventBlock { blockStyleName }
`;

const BLOCKS = `
  blocks {
    ${LEAF_BLOCK}
    ... on FlexBlock { blocks { alignment { x y } block { ${LEAF_BLOCK} } } }
  }
`;

const TEASER = `
  id slug publishedAt
  tags { tag }
  latest {
    title
    properties { key value }
    image { ${IMAGE} }
    authors { author { id name } }
  }
`;

export const ARTICLE_BY_SLUG = `
  query ArticleBySlug($slug: String!) {
    article(slug: $slug) {
      id slug publishedAt
      tags { tag }
      latest {
        title lead
        properties { key value }
        socialMediaImage { url }
        authors { author { id name bio links { title url } } }
        ${BLOCKS}
      }
    }
  }
`;

export const TEASER_BY_SLUG = `
  query TeaserBySlug($slug: String!) { article(slug: $slug) { ${TEASER} } }
`;

export const PAGE_BY_SLUG = `
  query PageBySlug($slug: String!) {
    page(slug: $slug) { id slug latest { title ${BLOCKS} } }
  }
`;

export const ARTICLE_LIST = `
  query ArticleList($take: Int!, $skip: Int!, $exclude: [String!]) {
    articles(take: $take, skip: $skip, sort: PublishedAt, order: Descending, filter: { excludeIds: $exclude }) {
      totalCount
      nodes { ${TEASER} }
    }
  }
`;

export const PHRASE_SEARCH = `
  query PhraseSearch($query: String!, $take: Int!, $skip: Int!) {
    phrase(query: $query, take: $take, skip: $skip) {
      articles { totalCount nodes { ${TEASER} } }
    }
  }
`;

export const EVENT_LIST = `
  query EventList($take: Int!, $upcomingOnly: Boolean) {
    events(take: $take, sort: StartsAt, order: Ascending, filter: { upcomingOnly: $upcomingOnly }) {
      nodes { id name startsAt description tags { tag } }
    }
  }
`;

export const NAVIGATIONS = `
  query Navigations {
    navigations {
      key
      links {
        __typename
        label
        ... on PageNavigationLink { page { id slug } }
        ... on ArticleNavigationLink { article { id slug } }
        ... on ExternalNavigationLink { url }
      }
    }
  }
`;

export const PRIMARY_BANNER = `
  query PrimaryBanner($documentType: BannerDocumentType!, $documentId: String!) {
    primaryBanner(documentType: $documentType, documentId: $documentId,
      loggedIn: false, hasSubscription: false, hasPaywallBypass: false) { id title html text }
  }
`;

export const HOME_PAGE_ID = `query HomePage { page(slug: "nw-home") { id } }`;

// the /abos form's configuration (resolvers.js `SubscribeBlockQuery`)
export const PAGE_BLOCKS_BY_ID = `
  query PageBlocksById($id: String!) { page(id: $id) { id latest { ${BLOCKS} } } }
`;

export const ARTICLE_BLOCKS_BY_ID = `
  query ArticleBlocksById($id: String!) { article(id: $id) { id latest { ${BLOCKS} } } }
`;
