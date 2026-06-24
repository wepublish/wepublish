import { readFileSync } from 'fs';

const ARTICLES_06_PATH = new URL('../06-articles.json', import.meta.url)
  .pathname;
const ARTICLES_07_PATH = new URL('../07-articles.json', import.meta.url)
  .pathname;

const args = parseArgs(process.argv.slice(2));

const ENDPOINT =
  args['--endpoint'] ?? 'https://api-review02.wepublish.works/v1';
const EMAIL = args['--email'];
const PASSWORD = args['--password'];
const TOTP = args['--totp'];
const DRY_RUN = '--dry-run' in args;

if (!EMAIL || !PASSWORD) {
  console.error(
    'Usage: node scripts/10-upload.mjs --email <email> --password <password> [--totp <code>] [--endpoint <url>] [--dry-run]'
  );
  process.exit(1);
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      result[argv[i]] =
        argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return result;
}

async function gql(query, variables, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL: ${json.errors.map(e => e.message).join(', ')}`);
  }
  return json.data;
}

async function login() {
  const data = await gql(
    `mutation CreateSession($email: String!, $password: String!, $totpToken: String) {
            createSession(email: $email, password: $password, totpToken: $totpToken) {
                token
            }
        }`,
    { email: EMAIL, password: PASSWORD, totpToken: TOTP ?? null }
  );
  return data.createSession.token;
}

// Maps __typename suffix to BlockContentInput field key and the field transformation
const TYPENAME_TO_INPUT = {
  TitleBlock: b => ({
    title: { title: b.title ?? null, lead: b.lead ?? null },
  }),
  RichTextBlock: b => ({ richText: { richText: b.richText } }),
  ImageBlock: b => ({
    image: {
      caption: b.caption ?? null,
      linkUrl: b.linkUrl ?? null,
      imageID: b.image?.id ?? null,
    },
  }),
  ImageGalleryBlock: b => ({
    imageGallery: {
      images: (b.images ?? []).map(img => ({
        caption: img.caption ?? null,
        imageID: img.image?.id ?? null,
      })),
    },
  }),
  QuoteBlock: b => ({
    quote: {
      quote: b.quote ?? null,
      author: b.author ?? null,
      imageID: b.image?.id ?? null,
    },
  }),
  IFrameBlock: b => ({
    embed: {
      url: b.url ?? null,
      title: b.title ?? null,
      width: b.width ?? null,
      height: b.height ?? null,
      styleCustom: b.styleCustom ?? null,
      sandbox: b.sandbox ?? null,
    },
  }),
  YouTubeVideoBlock: b => ({ youTubeVideo: { videoID: b.videoID } }),
  VimeoVideoBlock: b => ({ vimeoVideo: { videoID: b.videoID } }),
  TwitterTweetBlock: b => ({
    twitterTweet: { userID: b.userID, tweetID: b.tweetID },
  }),
  InstagramPostBlock: b => ({ instagramPost: { postID: b.postID } }),
  FacebookPostBlock: b => ({
    facebookPost: { userID: b.userID, postID: b.postID },
  }),
  TikTokVideoBlock: b => ({
    tikTokVideo: { videoID: b.videoID, userID: b.userID },
  }),
  SoundCloudTrackBlock: b => ({ soundCloudTrack: { trackID: b.trackID } }),
  BreakBlock: b => ({
    linkPageBreak: {
      text: b.text ?? null,
      richText: b.richText ?? [],
      linkText: b.linkText ?? null,
      linkURL: b.linkURL ?? null,
      linkTarget: b.linkTarget ?? null,
      hideButton: b.hideButton ?? false,
      imageID: b.image?.id ?? null,
    },
  }),
  ListicleBlock: b => ({
    listicle: {
      items: (b.items ?? []).map(item => ({
        title: item.title ?? null,
        richText: item.richText ?? [],
        imageID: item.image?.id ?? null,
      })),
    },
  }),
  TeaserGridBlock: b => ({
    teaserGrid: {
      numColumns: b.numColumns,
      teasers: (b.teasers ?? []).map(teaser => {
        if (!teaser) {
          return null;
        }
        switch (teaser.__typename) {
          case 'ArticleTeaser':
            return {
              article: {
                type: teaser.type,
                preTitle: teaser.preTitle ?? null,
                title: teaser.title ?? null,
                lead: teaser.lead ?? null,
                imageID: teaser.image?.id ?? null,
                articleID: teaser.article?.id ?? null,
              },
            };
          case 'PageTeaser':
            return {
              page: {
                type: teaser.type,
                preTitle: teaser.preTitle ?? null,
                title: teaser.title ?? null,
                lead: teaser.lead ?? null,
                imageID: teaser.image?.id ?? null,
                pageID: teaser.page?.id ?? null,
              },
            };
          case 'EventTeaser':
            return {
              event: {
                type: teaser.type,
                preTitle: teaser.preTitle ?? null,
                title: teaser.title ?? null,
                lead: teaser.lead ?? null,
                imageID: teaser.image?.id ?? null,
                eventID: teaser.event?.id ?? null,
              },
            };
          case 'CustomTeaser':
            return {
              custom: {
                type: teaser.type,
                preTitle: teaser.preTitle ?? null,
                title: teaser.title ?? null,
                lead: teaser.lead ?? null,
                imageID: teaser.image?.id ?? null,
                contentUrl: teaser.contentUrl ?? null,
                openInNewTab: teaser.openInNewTab ?? false,
              },
            };
          default:
            throw new Error(`Unknown teaser type: ${teaser.__typename}`);
        }
      }),
    },
  }),
  HTMLBlock: b => ({ html: { html: b.html ?? '' } }),
  PollBlock: b => ({ poll: { pollId: b.poll?.id ?? null } }),
  EventBlock: b => ({
    event: {
      filter: { tags: b.filter?.tags ?? [], events: b.filter?.events ?? [] },
    },
  }),
  CrowdfundingBlock: b => ({
    crowdfunding: { crowdfundingId: b.crowdfunding?.id ?? null },
  }),
};

function convertBlock(block) {
  const converter = TYPENAME_TO_INPUT[block.__typename];
  if (!converter) {
    throw new Error(`Unknown block type: ${block.__typename}`);
  }
  return converter(block);
}

function buildVariables(article) {
  const latest = article.latest;
  return {
    id: article.id,
    authorIds: (latest.authors ?? []).map(a => a.id),
    blocks: (latest.blocks ?? []).map(convertBlock),
    breaking: latest.breaking ?? false,
    canonicalUrl: latest.canonicalUrl ?? '',
    disableComments: article.disableComments ?? false,
    hidden: article.hidden ?? false,
    hideAuthor: latest.hideAuthor ?? false,
    imageID: latest.image?.id ?? null,
    lead: latest.lead ?? null,
    preTitle: latest.preTitle ?? null,
    properties: (latest.properties ?? []).map(p => ({
      key: p.key,
      value: p.value,
      public: p.public,
    })),
    seoTitle: latest.seoTitle ?? null,
    shared: article.shared ?? false,
    slug: article.slug ?? null,
    socialMediaAuthorIds: [],
    socialMediaDescription: latest.socialMediaDescription ?? null,
    socialMediaImageID: null,
    socialMediaTitle: latest.socialMediaTitle ?? null,
    tagIds: (article.tags ?? []).map(t => t.id),
    title: latest.title ?? null,
  };
}

const PUBLISH_MUTATION = `
    mutation PublishArticle($id: String!, $publishedAt: DateTime!) {
        publishArticle(id: $id, publishedAt: $publishedAt) {
            id
        }
    }
`;

const UPDATE_MUTATION = `
    mutation UpdateArticle(
        $id: String!
        $authorIds: [String!]!
        $blocks: [BlockContentInput!]!
        $breaking: Boolean!
        $canonicalUrl: String!
        $disableComments: Boolean!
        $hidden: Boolean!
        $hideAuthor: Boolean!
        $imageID: String
        $lead: String
        $preTitle: String
        $properties: [PropertyInput!]!
        $seoTitle: String
        $shared: Boolean!
        $slug: String
        $socialMediaAuthorIds: [String!]!
        $socialMediaDescription: String
        $socialMediaImageID: String
        $socialMediaTitle: String
        $tagIds: [String!]!
        $title: String
    ) {
        updateArticle(
            id: $id
            authorIds: $authorIds
            blocks: $blocks
            breaking: $breaking
            canonicalUrl: $canonicalUrl
            disableComments: $disableComments
            hidden: $hidden
            hideAuthor: $hideAuthor
            imageID: $imageID
            lead: $lead
            preTitle: $preTitle
            properties: $properties
            seoTitle: $seoTitle
            shared: $shared
            slug: $slug
            socialMediaAuthorIds: $socialMediaAuthorIds
            socialMediaDescription: $socialMediaDescription
            socialMediaImageID: $socialMediaImageID
            socialMediaTitle: $socialMediaTitle
            tagIds: $tagIds
            title: $title
        ) {
            id
        }
    }
`;

async function main() {
  console.log(`Endpoint:  ${ENDPOINT}`);
  console.log(`Email:     ${EMAIL}`);
  console.log(`Dry run:   ${DRY_RUN}`);
  console.log();

  console.log('Reading article files...');
  const data06 = JSON.parse(readFileSync(ARTICLES_06_PATH, 'utf8'));
  const data07 = JSON.parse(readFileSync(ARTICLES_07_PATH, 'utf8'));

  const map06 = Object.fromEntries(data06.articles.map(a => [a.id, a]));

  const changed = data07.articles.filter(a07 => {
    const a06 = map06[a07.id];
    return !a06 || JSON.stringify(a06) !== JSON.stringify(a07);
  });

  console.log(`Total articles: ${data06.articles.length}`);
  console.log(`Changed:        ${changed.length}`);
  console.log();

  if (changed.length === 0) {
    console.log('Nothing to update.');
    return;
  }

  let token;
  if (!DRY_RUN) {
    process.stdout.write('Logging in...');
    token = await login();
    console.log(' done');
    console.log();
  }

  let done = 0;
  let errors = 0;
  const errorList = [];

  for (const article of changed) {
    let variables;
    try {
      variables = buildVariables(article);
    } catch (err) {
      errors++;
      errorList.push({
        id: article.id,
        error: `buildVariables: ${err.message}`,
      });
      process.stdout.write(
        `\r  ${++done}/${changed.length} (${errors} errors)`
      );
      continue;
    }

    if (DRY_RUN) {
      process.stdout.write(`\r  ${++done}/${changed.length} (dry run)`);
      continue;
    }

    try {
      await gql(UPDATE_MUTATION, variables, token);
      await gql(
        PUBLISH_MUTATION,
        {
          id: article.id,
          publishedAt: article.publishedAt ?? new Date().toISOString(),
        },
        token
      );
    } catch (err) {
      errors++;
      errorList.push({ id: article.id, error: err.message });
    }
    process.stdout.write(`\r  ${++done}/${changed.length} (${errors} errors)`);
  }

  console.log();
  console.log();
  console.log(`Done. ${done - errors} updated, ${errors} errors.`);

  if (errorList.length > 0) {
    console.log('\nErrors:');
    for (const { id, error } of errorList) {
      console.log(`  ${id}: ${error}`);
    }
  }
}

main().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
