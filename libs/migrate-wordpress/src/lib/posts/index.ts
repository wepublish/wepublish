import { fetchPost, fetchPosts, WordpressPost } from './wordpress-api';
import { migratePost } from './post';
import { prepareArticleData } from './prepare-data';
import { mapLimit } from 'async';
import chalk from 'chalk';
import { logError } from './error-logger';
import { createTimer, humanizeObject, slugify } from './utils';
import { fixedMessage } from '../logger';
import { getArticleBySlug } from './article';

export const updateExistingArticles = true;
export const deleteExistingPosts = false;
export const deleteExistingAuthors = false;

const terminalLink = (uri: string, label: string) =>
  `\x1b]8;;${uri}\x1b\\${label}\x1b]8;;\x1b\\`;

async function prepareDataAndMigratePost(post: WordpressPost) {
  try {
    console.debug(`Migrating article ${post.slug}`);

    const slug = slugify(post.slug);
    const existingArticle = await getArticleBySlug(slug);
    if (!deleteExistingPosts && existingArticle && !updateExistingArticles) {
      return existingArticle;
    }

    const data = await prepareArticleData(post);
    const { title, link } = data;
    console.debug({ title, slug, link });
    return await migratePost(data);
  } catch (error: any) {
    const logDirectory = await logError(
      `article-${post.id}`,
      `Article postId: ${post.id} FAILED`
    );
    const logsLink = terminalLink(
      `file://${process.cwd()}/${logDirectory}`,
      ' /logs'
    );
    console.error(
      chalk.bgRed.black(`Article postId: ${post.id} FAILED${logsLink}`)
    );
    await logError(`article-${post.id}`, post.link);
    await logError(`article-${post.id}`, error.stack ?? error.message);
    return;
  }
}

export const migrateAllPosts = async (limit?: number) => {
  console.log(`Migrating general articles (${humanizeObject({ limit })})`);
  await migratePosts(limit);
};

export const migratePostsFromCategory = async (
  categoryId: number,
  limit?: number
) => {
  console.log(
    `Migrating category articles (${humanizeObject({ categoryId, limit })})`
  );
  await migratePosts(limit, { categoryId });
};

export const migratePosts = async (
  limit?: number,
  query?: Record<string, string | number>
) => {
  const timer = createTimer();
  fixedMessage('Running');
  timer.onUpdate(() => {
    fixedMessage(timer.message());
  });
  let batchSize = process.env['WORDPRESS_BATCH_SIZE'] ?? 10;
  const concurrency = process.env['PROCESSOR_CONCURRENCY'] ?? 5;
  let postsMigrating = 0;
  let postsMigrated = 0;
  let totalCount: number;
  for (let page = 1; ; page++) {
    if (limit) {
      batchSize = Math.min(limit - postsMigrated, +batchSize);
    }

    console.debug(`Fetching page ${page}`);
    const { items: batch, total } = await fetchPosts({
      ...query,
      page,
      perPage: +batchSize,
      orderby: 'modified',
      order: 'desc',
    });
    totalCount = limit ? Math.min(+total, limit) : +total;
    timer.updateTotal(totalCount);

    if (batch.length === 0) break;

    await mapLimit(batch, +concurrency, async (post: WordpressPost) => {
      postsMigrating++;
      const result = await prepareDataAndMigratePost(post);
      if (result) {
        console.log(
          `Migrated post id: ${chalk.bgYellow(
            post.id
          )} (${++postsMigrated}/${totalCount}) ${chalk.bgGreen('DONE')} ${result.url}`
        );
      } else {
        postsMigrated++;
      }
      timer.updateDone(postsMigrated);
    });

    if (limit !== undefined && postsMigrated >= limit) {
      return;
    }
  }
};

export const migratePostById = async (...ids: number[]) => {
  console.log(`Migrating ${ids.length} articles by id`);
  await mapLimit(ids, 5, async (id: number) => {
    console.debug(`Loading post ${id}`);
    const post = await fetchPost(id);
    console.debug(`Migrating post id: ${id}`);
    const result = await prepareDataAndMigratePost(post);
    if (result) {
      console.log(
        `Migrated article id: ${chalk.bgYellow(id)} (${ids.indexOf(id) + 1}/${
          ids.length
        }) ${chalk.bgGreen('DONE')} ${result.url}`
      );
    }
  });
};
