#!/usr/bin/env node

/**
 * Downloads all articles from the wepublish GraphQL API and streams them to a JSON file.
 * Usage: node scripts/download-articles.mjs [output-file]
 * Default output: articles.json
 */

import { createWriteStream } from 'fs';

const ENDPOINT = 'https://api-review02.wepublish.works/v1';
const OUTPUT_FILE = process.argv[2] ?? 'articles.json';
const BATCH_SIZE = 100;

const QUERY = `
  query DownloadArticles($cursor: String, $take: Int) {
    articles(cursorId: $cursor, take: $take) {
      nodes {
        id
        createdAt
        modifiedAt
        publishedAt
        url
        previewUrl
        slug
        likes
        shared
        hidden
        disableComments
        peerId
        peerArticleId
        tags {
          id
          tag
          url
          main
        }
        latest {
          id
          createdAt
          publishedAt
          preTitle
          title
          lead
          canonicalUrl
          hideAuthor
          breaking
          seoTitle
          socialMediaTitle
          socialMediaDescription
          authors {
            id
            name
            slug
            url
          }
          image {
            id
            filename
            title
            description
            url
          }
          properties {
            key
            value
            public
          }
          blocks {
            __typename
            ... on TitleBlock {
              title
              lead
            }
            ... on RichTextBlock {
              richText
            }
            ... on ImageBlock {
              caption
              image {
                id
                filename
                title
                url
              }
            }
            ... on ImageGalleryBlock {
              images {
                caption
                image {
                  id
                  filename
                  title
                  url
                }
              }
            }
            ... on QuoteBlock {
              quote
              author
              image {
                id
                url
              }
            }
            ... on IFrameBlock {
              url
              title
              width
              height
              styleCustom
              sandbox
            }
            ... on YouTubeVideoBlock {
              videoID
            }
            ... on VimeoVideoBlock {
              videoID
            }
            ... on TwitterTweetBlock {
              userID
              tweetID
            }
            ... on InstagramPostBlock {
              postID
            }
            ... on FacebookPostBlock {
              userID
              postID
            }
            ... on TikTokVideoBlock {
              videoID
              userID
            }
            ... on SoundCloudTrackBlock {
              trackID
            }
            ... on BreakBlock {
              text
              richText
              linkText
              linkURL
              linkTarget
              hideButton
              image {
                id
                url
              }
            }
            ... on ListicleBlock {
              items {
                title
                richText
                image {
                  id
                  url
                }
              }
            }
            ... on TeaserGridBlock {
              numColumns
              teasers {
                __typename
                ... on ArticleTeaser {
                  type
                  preTitle
                  title
                  lead
                  article {
                    id
                    latest { title }
                  }
                  image { id url }
                }
                ... on PageTeaser {
                  type
                  preTitle
                  title
                  lead
                  page {
                    id
                    latest { title }
                  }
                  image { id url }
                }
                ... on EventTeaser {
                  type
                  preTitle
                  title
                  lead
                  event {
                    id
                    name
                    lead
                    startsAt
                    endsAt
                    url
                  }
                  image { id url }
                }
                ... on CustomTeaser {
                  type
                  preTitle
                  title
                  lead
                  contentUrl
                  openInNewTab
                  image { id url }
                }
              }
            }
            ... on HTMLBlock {
              html
            }
            ... on PollBlock {
              poll {
                id
                question
              }
            }
            ... on EventBlock {
              filter {
                tags
              }
              events {
                id
                name
                lead
                startsAt
                endsAt
                url
              }
            }
            ... on CrowdfundingBlock {
              crowdfunding {
                id
                name
                goalType
                goals {
                  id
                }
              }
            }
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

async function fetchArticles(cursor) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: QUERY,
      variables: { cursor, take: BATCH_SIZE },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(
      `GraphQL errors: ${json.errors.map(e => e.message).join(', ')}`
    );
  }

  return json.data.articles;
}

function writeChunk(stream, data) {
  return new Promise((resolve, reject) => {
    const ok = stream.write(data);
    if (ok) {
      resolve();
    } else {
      stream.once('drain', resolve);
      stream.once('error', reject);
    }
  });
}

async function main() {
  const startTime = Date.now();
  console.log(`Endpoint:    ${ENDPOINT}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log();

  const stream = createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });

  let cursor = null;
  let totalCount = null;
  let fetched = 0;
  let page = 1;
  let firstArticle = true;

  await writeChunk(stream, '{\n');

  while (true) {
    const pageStart = Date.now();
    const result = await fetchArticles(cursor);
    const pageMs = Date.now() - pageStart;

    if (totalCount === null) {
      totalCount = result.totalCount;
      const header =
        `  "downloadedAt": ${JSON.stringify(new Date().toISOString())},\n` +
        `  "endpoint": ${JSON.stringify(ENDPOINT)},\n` +
        `  "totalCount": ${totalCount},\n` +
        `  "articles": [\n`;
      await writeChunk(stream, header);
    }

    for (const article of result.nodes) {
      const prefix = firstArticle ? '    ' : ',\n    ';
      await writeChunk(stream, prefix + JSON.stringify(article, null, 4));
      firstArticle = false;
    }

    fetched += result.nodes.length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pct = ((fetched / totalCount) * 100).toFixed(1);
    const pages = Math.ceil(totalCount / BATCH_SIZE);
    const eta =
      fetched < totalCount ?
        Math.round(
          (((Date.now() - startTime) / fetched) * (totalCount - fetched)) / 1000
        )
      : 0;

    process.stdout.write(
      `\r  Page ${String(page).padStart(4)}/${pages}  ` +
        `${String(fetched).padStart(6)}/${totalCount} articles  ` +
        `${pct.padStart(5)}%  ` +
        `${pageMs}ms/req  ` +
        `${elapsed}s elapsed  ` +
        (fetched < totalCount ? `ETA ~${eta}s` : 'done    ')
    );

    if (!result.pageInfo.hasNextPage) {
      break;
    }

    cursor = result.pageInfo.endCursor;
    page++;
  }

  await writeChunk(stream, '\n  ]\n}\n');

  await new Promise((resolve, reject) => {
    stream.end(err => (err ? reject(err) : resolve()));
  });

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\n\nWrote ${fetched} articles to ${OUTPUT_FILE} in ${totalSec}s`
  );
}

main().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
