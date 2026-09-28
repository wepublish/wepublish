// we.publish → Drupal-shaped data for the clone's own GraphQL documents.
//
// Each resolver answers one operation of lib/queries.js and returns EXACTLY
// the JSON the Drupal API would have returned for it — same aliases, same
// __typenames — so Apollo, the components and the CSS see no difference.
// The import (importers/neuewege/content) is designed for this round trip:
// one Drupal paragraph = one we.publish block, recognizable by type/style.
// Drupal allowed several URL aliases per node (e.g. /archiv and /links are the
// same page); a we.publish page has one slug, so extra aliases map here.
import aliases from './aliases.json';
import { wepublishQuery } from './client';
import eventPaths from './event-paths.json';
import {
  ARTICLE_BLOCKS_BY_ID,
  ARTICLE_BY_SLUG,
  ARTICLE_LIST,
  EVENT_LIST,
  HOME_PAGE_ID,
  IMAGE_WIDTHS,
  NAVIGATIONS,
  PAGE_BLOCKS_BY_ID,
  PAGE_BY_SLUG,
  PHRASE_SEARCH,
  PRIMARY_BANNER,
  TEASER_BY_SLUG,
} from './queries';
import { splitAtRules, tiptapToHtml } from './richtext-html';
import { SUBSCRIBE_REF } from './subscribe-ref';

// ---- small helpers -----------------------------------------------------------

const slugToPath = slug => `/${slug}`;
const escapeHtml = text =>
  String(text).replace(
    /[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );
const pathToSlug = path => String(path || '').replace(/^\/+/, '');
// Dates were imported at 12:00 UTC → the calendar day is the first 10 chars.
const dateOnly = iso =>
  iso ? { __typename: 'DateTimeItem', value: iso.slice(0, 10) } : null;
const props = rev =>
  Object.fromEntries((rev?.properties || []).map(p => [p.key, p.value]));

// Author names: we.publish stores one name; the components print
// `${firstname} ${lastname}`, so any split at a space renders identically.
function splitName(name = '') {
  const i = name.indexOf(' ');
  return i < 0 ?
      { firstname: name, lastname: '' }
    : { firstname: name.slice(0, i), lastname: name.slice(i + 1) };
}

function mediaImage(image, caption) {
  if (!image) return null;
  const styles = {};
  for (const [alias, target] of Object.entries(IMAGE_WIDTHS)) {
    const width = image.width ? Math.min(target, image.width) : target;
    styles[alias] = {
      __typename: 'ImageStyleDerivative',
      width,
      url: image[alias] || image.url,
    };
  }
  const xxxl = styles.style_xxxl;
  xxxl.height =
    image.width && image.height ?
      Math.round((image.height * xxxl.width) / image.width)
    : null;
  return {
    __typename: 'MediaImage',
    uuid: image.id,
    caption: {
      __typename: 'FieldMediaImageFieldCaption',
      format: 'basic_html',
      processed: caption || '',
    },
    image: {
      __typename: 'FieldMediaImageFieldMediaImage',
      alt: image.description || image.title || '',
      ...styles,
    },
  };
}

// ---- blocks → paragraphs -----------------------------------------------------------

function textParagraph(key, html, format = 'basic_html') {
  return {
    __typename: 'ParagraphText',
    key,
    text: {
      __typename: 'FieldParagraphTextFieldText',
      format,
      processed: html,
    },
  };
}

function headingText(doc) {
  const node =
    (doc?.content || []).find(n => n.type === 'heading') || doc?.content?.[0];
  return (node?.content || []).map(n => n.text || '').join('');
}

function footnotes(doc, key) {
  const list = (doc?.content || []).find(n => n.type === 'orderedList');
  return (list?.content || []).map((item, i) => ({
    __typename: 'FieldParagraphFootnotesFieldFootnoteList',
    footnote: {
      __typename: 'ParagraphFootnote',
      uuid: `${key}-fn${i}`,
      text: {
        __typename: 'FieldParagraphFootnoteFieldFootnote',
        format: 'basic_html',
        processed: tiptapToHtml({ type: 'doc', content: item.content }),
      },
    },
  }));
}

function downloads(doc, key) {
  const out = [];
  const walk = node => {
    for (const n of node?.content || []) {
      const link =
        n.type === 'text' && (n.marks || []).find(m => m.type === 'link');
      if (link) {
        out.push({
          __typename: 'FieldParagraphDownloadsFieldDownloads',
          download: {
            __typename: 'MediaFile',
            uuid: `${key}-dl${out.length}`,
            name: n.text,
            fieldMediaFile: { entity: { url: link.attrs.href } },
          },
        });
      } else walk(n);
    }
  };
  walk(doc);
  return out;
}

function blockToParagraph(block, key, ctx) {
  switch (block.__typename) {
    case 'RichTextBlock': {
      const doc = block.richText;
      switch (block.blockStyleName) {
        case 'subtitle':
          return {
            __typename: 'ParagraphTitle',
            key,
            subtitle: headingText(doc),
          };
        case 'question':
          return {
            __typename: 'ParagraphInterviewQuestion',
            key,
            text: {
              __typename: 'FieldParagraphInterviewQuestionFieldText',
              processed: tiptapToHtml(doc),
            },
          };
        case 'info':
          return {
            __typename: 'ParagraphInfo',
            key,
            text: {
              __typename: 'FieldParagraphInfoFieldText',
              processed: tiptapToHtml(doc),
            },
          };
        case 'footnotes':
          return {
            __typename: 'ParagraphFootnotes',
            key,
            footnotesArray: footnotes(doc, key),
          };
        case 'downloads':
          return {
            __typename: 'ParagraphDownloads',
            key,
            downloads: downloads(doc, key),
          };
        default:
          if (block.blockStyleName?.startsWith('webform-')) {
            return {
              __typename: 'ParagraphWebform',
              key,
              fieldWebform: { id: block.blockStyleName.slice(8) },
            };
          }
          return textParagraph(key, tiptapToHtml(doc));
      }
    }
    case 'HTMLBlock':
      if (block.html === '<!-- neuewege: ParagraphDonorBox -->')
        return { __typename: 'ParagraphDonorBox', key };
      return textParagraph(key, block.html, 'raw_html');
    case 'QuoteBlock':
      return { __typename: 'ParagraphQuote', key, quote: block.quote };
    // pages built in we.publish (e.g. success, failure): a title block
    // renders like a Drupal title paragraph, its lead as text
    case 'TitleBlock':
      return [
        block.title && {
          __typename: 'ParagraphTitle',
          key,
          subtitle: block.title,
        },
        block.lead &&
          textParagraph(`${key}-lead`, `<p>${escapeHtml(block.lead)}</p>`),
      ].filter(Boolean);
    case 'ImageBlock':
      return block.image ?
          {
            __typename: 'ParagraphImages',
            key,
            imagesArray: [
              {
                __typename: 'FieldParagraphImagesFieldImages',
                entity: mediaImage(block.image, block.caption),
              },
            ],
          }
        : null;
    case 'ImageGalleryBlock':
      return {
        __typename: 'ParagraphImages',
        key,
        imagesArray: (block.images || [])
          .filter(i => i.image)
          .map(i => ({
            __typename: 'FieldParagraphImagesFieldImages',
            entity: mediaImage(i.image, i.caption),
          })),
      };
    case 'FlexBlock': {
      const column = x =>
        (block.blocks || [])
          .filter(c => c.alignment?.x === x && c.block)
          .sort((a, b) => a.alignment.y - b.alignment.y)
          .flatMap((c, i) =>
            [blockToParagraph(c.block, `${key}-c${x}-${i}`, ctx)].flat()
          )
          .filter(Boolean)
          .map(paragraph => ({
            __typename: 'FieldParagraph2ColumnFieldFirstColumn',
            paragraph,
          }));
      return {
        __typename: 'Paragraph2Column',
        key,
        firstColumn: column(0),
        secondColumn: column(6),
      };
    }
    // the /abos form (components/subscribe-form.js). The Drupal documents
    // only select the webform id, so the paragraph carries a reference to the
    // block; the form loads its configuration with SubscribeBlockQuery.
    case 'SubscribeBlock':
      return {
        __typename: 'ParagraphWebform',
        key,
        fieldWebform: {
          id: `${SUBSCRIBE_REF}${ctx.owner}:${ctx.ownerId}:${ctx.subscribeBlocks++}`,
        },
      };
    case 'EventBlock':
      return { __typename: 'ParagraphAgenda', key };
    default:
      return null;
  }
}

function paragraphs(blocks, ownerId, owner) {
  const ctx = { owner, ownerId, subscribeBlocks: 0 };
  return (blocks || [])
    .flatMap((b, i) => blockToParagraph(b, `${ownerId}-${i}`, ctx))
    .filter(Boolean)
    .map(paragraph => ({ __typename: 'FieldNodeFieldBody', paragraph }));
}

// ---- entities ---------------------------------------------------------------------

function topicTags(article) {
  // The print issue is its own tag in we.publish; Drupal showed it only as
  // the publication line, never among the tags.
  const issue = props(article.latest)['nw-publication'];
  return (article.tags || []).filter(t => t.tag !== issue);
}

function teaser(article) {
  const rev = article.latest || {};
  const p = props(rev);
  return {
    __typename: 'NodeArticle',
    id: article.id,
    uuid: article.id,
    title: rev.title,
    url: { __typename: 'EntityCanonicalUrl', path: slugToPath(article.slug) },
    teaser_text: p['nw-teaser-text'] || null,
    teaser_image:
      rev.image ?
        {
          __typename: 'FieldNodeArticleFieldTeaserImage',
          entity: mediaImage(rev.image),
        }
      : null,
    date: dateOnly(article.publishedAt),
    authors: (rev.authors || []).map(a => ({
      __typename: 'FieldNodeArticleFieldAuthors',
      author: { __typename: 'User', ...splitName(a.author?.name), mail: null },
    })),
    tags: topicTags(article).map(t => ({
      __typename: 'FieldNodeArticleFieldTags',
      entity: {
        __typename: 'TaxonomyTermTags',
        uuid: t.tag,
        label: t.tag,
        url: { __typename: 'EntityCanonicalUrl', path: '/' },
      },
    })),
  };
}

async function relatedTeasers(slugs) {
  const results = await Promise.all(
    slugs.map(slug =>
      wepublishQuery(TEASER_BY_SLUG, { slug }).catch(() => null)
    )
  );
  return results
    .map(r => r?.article)
    .filter(Boolean)
    .map(teaser);
}

async function articleEntity(article) {
  const rev = article.latest || {};
  const p = props(rev);
  const related =
    p['nw-related'] ? p['nw-related'].split(',').filter(Boolean) : [];
  return {
    __typename: 'NodeArticle',
    tags: topicTags(article).map(t => ({
      __typename: 'FieldNodeArticleFieldTags',
      entity: {
        __typename: 'TaxonomyTermTags',
        label: t.tag,
        url: { __typename: 'EntityCanonicalUrl', path: '/', routed: true },
      },
    })),
    socialMediaImage:
      rev.socialMediaImage ?
        {
          __typename: 'FieldNodeArticleFieldSocialMediaImage',
          entity: {
            __typename: 'MediaFile',
            fieldMediaFile: { entity: { url: rev.socialMediaImage.url } },
          },
        }
      : null,
    pageType: 'article',
    url: { __typename: 'EntityCanonicalUrl', path: slugToPath(article.slug) },
    title: rev.title,
    authors: (rev.authors || []).map(a => {
      const links = a.author?.links || [];
      const mail = links.find(l => l.url.startsWith('mailto:'));
      return {
        __typename: 'FieldNodeArticleFieldAuthors',
        entity: { __typename: 'User', uuid: a.author?.id },
        author: {
          __typename: 'User',
          mail: mail ? mail.url.slice(7) : null,
          ...splitName(a.author?.name),
          bio:
            a.author?.bio ?
              {
                __typename: 'FieldUserFieldText',
                processed: tiptapToHtml(a.author.bio),
              }
            : null,
          links: links
            .filter(l => l !== mail)
            .map(l => ({
              __typename: 'FieldUserFieldLinks',
              uri: l.url,
              title: l.title,
            })),
        },
      };
    }),
    date: dateOnly(article.publishedAt),
    publication: p['nw-publication'] || null,
    lead: rev.lead || null,
    paragraphs: paragraphs(rev.blocks, article.id, 'article'),
    // 12 articles had no related list in Drupal (its resolver crashed) → null
    relatedArticles: related.length ? await relatedTeasers(related) : null,
  };
}

function pageEntity(page) {
  return {
    __typename: 'NodePage',
    pageType: 'page',
    title: page.latest?.title,
    paragraphs: paragraphs(page.latest?.blocks, page.id, 'page'),
  };
}

// Event body: description = column 1 | horizontal rule | column 2.
function eventEntity(event) {
  const [first, second] = splitAtRules(event.description);
  const column = (doc, suffix) =>
    doc && doc.content.length ?
      [
        {
          __typename: 'FieldParagraph2ColumnFieldFirstColumn',
          paragraph: textParagraph(`${event.id}-${suffix}`, tiptapToHtml(doc)),
        },
      ]
    : [];
  return {
    __typename: 'NodeEvent',
    key: event.id,
    title: event.name,
    date: dateOnly(event.startsAt),
    paragraphs: [
      {
        __typename: 'FieldNodeFieldBody',
        paragraph: {
          __typename: 'Paragraph2Column',
          key: `${event.id}-body`,
          firstColumn: column(first, 'c1'),
          secondColumn: column(second, 'c2'),
        },
      },
    ],
  };
}

let eventsCache = null;
async function allEvents() {
  if (!eventsCache || eventsCache.at < Date.now() - 60000) {
    const data = await wepublishQuery(EVENT_LIST, {
      take: 1000,
      upcomingOnly: false,
    });
    eventsCache = { at: Date.now(), nodes: data?.events?.nodes || [] };
  }
  return eventsCache.nodes;
}

let pinnedCache = null;
async function pinnedIds() {
  if (!pinnedCache || pinnedCache.at < Date.now() - 60000) {
    const data = await wepublishQuery(NAVIGATIONS);
    const nav = (data?.navigations || []).find(n => n.key === 'pinned');
    pinnedCache = {
      at: Date.now(),
      ids: (nav?.links || []).map(l => l.article?.id).filter(Boolean),
      navigations: data?.navigations || [],
    };
  }
  return pinnedCache;
}

// ---- the clone's operations ----------------------------------------------------------

async function RouterQuery({ path }) {
  const slug = pathToSlug(aliases[path] || path);
  const route = entity =>
    entity ?
      { route: { __typename: 'EntityCanonicalUrl', entity } }
    : { route: null };
  if (!slug) return route(null);

  const article = (await wepublishQuery(ARTICLE_BY_SLUG, { slug }))?.article;
  if (article) return route(await articleEntity(article));

  const page = (await wepublishQuery(PAGE_BY_SLUG, { slug }))?.page;
  if (page && slug !== 'nw-home') return route(pageEntity(page));

  const ref = eventPaths[`/${slug}`];
  if (ref) {
    const event = (await allEvents()).find(
      e => e.name === ref.title && e.startsAt.slice(0, 10) === ref.date
    );
    if (event) return route(eventEntity(event));
  }
  return route(null);
}

async function searchApiQuery({ queryString, offset = 0, limit }) {
  const skip = offset * limit;
  const list = (count, entities) => ({
    searchIndexView: { __typename: 'SearchIndexView', count, entities },
  });

  if (queryString) {
    const data = await wepublishQuery(PHRASE_SEARCH, {
      query: queryString,
      take: limit,
      skip,
    });
    const res = data?.phrase?.articles;
    return list(res?.totalCount ?? 0, (res?.nodes || []).map(teaser));
  }

  // Home grid: pinned (sticky) articles first, then all others by date.
  const { ids } = await pinnedIds();
  const pinned = [];
  if (skip < ids.length) {
    for (const id of ids.slice(skip, skip + limit)) {
      const data = await wepublishQuery(
        `query($id: String!) { article(id: $id) { slug } }`,
        { id }
      );
      const slug = data?.article?.slug;
      const t =
        slug && (await wepublishQuery(TEASER_BY_SLUG, { slug }))?.article;
      if (t) pinned.push(teaser(t));
    }
  }
  const restSkip = Math.max(0, skip - ids.length);
  const restTake = limit - pinned.length;
  const data = await wepublishQuery(ARTICLE_LIST, {
    take: restTake,
    skip: restSkip,
    exclude: ids.length ? ids : null,
  });
  const res = data?.articles;
  return list((res?.totalCount ?? 0) + ids.length, [
    ...pinned,
    ...(res?.nodes || []).map(teaser),
  ]);
}

function eventTeaser(e) {
  return {
    __typename: 'NodeEvent',
    key: e.id,
    title: e.name,
    date: dateOnly(e.startsAt),
  };
}

// The home agenda box is editorially curated in Drupal (a subset of the
// upcoming events); the import marks those with the event tag `agenda-box`.
async function AgendaTeaserQuery({ offset = 0, limit = 30 }) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (await allEvents()).filter(
    e =>
      e.startsAt.slice(0, 10) >= today &&
      (e.tags || []).some(t => t.tag === 'agenda-box')
  );
  return {
    agenda: {
      __typename: 'AgendaTeaserView',
      events: upcoming
        .slice(offset * limit, (offset + 1) * limit)
        .map(eventTeaser),
    },
  };
}

async function AgendaQuery({ offset = 0, limit = 1000 }) {
  const events = (await allEvents()).slice(
    offset * limit,
    (offset + 1) * limit
  );
  return {
    agenda: { __typename: 'AgendaView', events: events.map(eventEntity) },
  };
}

async function MainMenuQuery({ name }) {
  const { navigations } = await pinnedIds();
  const nav = navigations.find(n => n.key === name);
  return {
    menu:
      nav ?
        {
          __typename: 'Menu',
          links: nav.links.map(l => ({
            __typename: 'MenuLink',
            expanded: false,
            description: null,
            label: l.label,
            url: {
              __typename: 'EntityCanonicalUrl',
              path:
                l.page ? slugToPath(l.page.slug)
                : l.article ? slugToPath(l.article.slug)
                : l.url,
              routed: true,
            },
          })),
        }
      : null,
  };
}

async function popup(documentType, typename) {
  let documentId = 'none';
  if (documentType === 'PAGE') {
    documentId = (await wepublishQuery(HOME_PAGE_ID))?.page?.id || 'none';
  }
  const banner = (
    await wepublishQuery(PRIMARY_BANNER, { documentType, documentId })
  )?.primaryBanner;
  return {
    collection: {
      __typename: 'EntityQueryResult',
      entities:
        banner ?
          [
            {
              __typename: typename,
              entityId: banner.id,
              entityLabel: banner.title,
              fieldText: {
                __typename: 'FieldBlockContentFieldText',
                value: banner.html,
                format: 'basic_html',
                processed: banner.html,
              },
            },
          ]
        : [],
    },
  };
}

const FrontPopup = () => popup('PAGE', 'BlockContentPopupFront');
const ArticlePopup = () => popup('ARTICLE', 'BlockContentPopupArticle');

async function PagerQuery({ queryString, page = 0, pageSize = 30 }) {
  const res = (
    await searchApiQuery({ queryString, offset: page, limit: pageSize })
  ).searchIndexView;
  return {
    searchIndexView: {
      __typename: 'SearchIndexView',
      count: res.count,
      results: res.entities.map(e => ({
        __typename: 'NodeArticle',
        entityUrl: {
          __typename: 'EntityCanonicalUrl',
          path: e.url.path,
          routed: true,
        },
      })),
    },
  };
}

// The SubscribeBlocks of a page or article in the order blockToParagraph
// numbers them: top level, and inside a flex block its two columns (x 0, then
// x 6), each sorted by row.
function subscribeBlocksOf(blocks) {
  const found = [];
  for (const block of blocks || []) {
    if (block.__typename === 'SubscribeBlock') found.push(block);
    if (block.__typename === 'FlexBlock') {
      for (const x of [0, 6]) {
        (block.blocks || [])
          .filter(c => c.alignment?.x === x && c.block)
          .sort((a, b) => a.alignment.y - b.alignment.y)
          .forEach(
            c => c.block.__typename === 'SubscribeBlock' && found.push(c.block)
          );
      }
    }
  }
  return found;
}

// Not a Drupal operation: the configuration of the /abos form
// (lib/wepublish/subscribe.js `SubscribeBlockQuery`), returned as one JSON leaf
async function SubscribeBlockQuery({ ref }) {
  const [owner, id, index] = String(ref).slice(SUBSCRIBE_REF.length).split(':');
  const query = owner === 'article' ? ARTICLE_BLOCKS_BY_ID : PAGE_BLOCKS_BY_ID;
  const data = await wepublishQuery(query, { id });
  const blocks = (owner === 'article' ? data?.article : data?.page)?.latest
    ?.blocks;
  const block = subscribeBlocksOf(blocks)[Number(index)];
  if (!block) return { subscribeBlock: null };
  const { __typename, ...config } = block;
  return {
    subscribeBlock: { __typename: 'SubscribeBlockConfig', ref, config },
  };
}

export const RESOLVERS = {
  SubscribeBlockQuery,
  RouterQuery,
  searchApiQuery,
  AgendaTeaserQuery,
  AgendaQuery,
  MainMenuQuery,
  FrontPopup,
  ArticlePopup,
  PagerQuery,
};
