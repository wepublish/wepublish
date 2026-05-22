/* eslint-disable i18next/no-literal-string */
/**
 * EE News — CMS seed (Step 3b per implementation plan; MP-8 per patterns skill).
 *
 * Fills the wepublish CMS with project-specific content matching the v2 design:
 *   - 9 block-styles (exact match to EeNewsBlockType enum)
 *   - 10 tags (4 main with Tag.color for topic strip, 6 secondary)
 *   - 10 authors with bios + social links
 *   - 1 featured article (slug `feature-netz`) + ~80 articles (8 per tag)
 *   - 4 CMS pages: home (slug ""), welt (slug "welt"), impressum, mitmachen-intro
 *   - 4 navigations: main / header / footer / icons
 *   - 4–10 events
 *   - 2 member plans (CHF + EUR) + 2 payment methods (Payrexx + Stripe)
 *   - 1 crowdfunding placeholder
 *   - Comments per article (0–8 + 0–4 replies)
 *
 * Run via the editor: <editor-host>/seed → password → "Create Content".
 *
 * The blockStyles array names MUST exactly match EeNewsBlockType enum values; if a name
 * is renamed in code, run delete + create here too. See the long-form rationale at
 * `~/.claude-wep/projects/-Users-jpp-Git-wepublish-claude-wep/memory/wepublish-cms-seed-strategy.md`.
 */
import { faker } from '@faker-js/faker';
import { capitalize } from '@mui/material';
import {
  ArticleListDocument,
  AuthorListDocument,
  BlockContentInput,
  BlockStyle,
  BlockStylesDocument,
  CommentItemType,
  CommentListDocument,
  CreateArticleMutationVariables,
  CrowdfundingGoalType,
  EventListDocument,
  getApiClientV2,
  ImageBlockInput,
  ImageListDocument,
  InvoicesDocument,
  MemberPlanListDocument,
  NavigationLinkType,
  NavigationListDocument,
  PageListDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
  ProductType,
  PropertyInput,
  RichTextBlockInput,
  SubscriptionFlowsDocument,
  SubscriptionListDocument,
  Tag,
  TagListDocument,
  TagType,
  TeaserListBlockSort,
  TeaserSlotInput,
  TeaserSlotsAutofillConfig,
  TeaserSlotsBlockInput,
  TeaserType,
  TitleBlockInput,
  useApproveCommentMutation,
  useCreateArticleMutation,
  useCreateAuthorMutation,
  useCreateBlockStyleMutation,
  useCreateCommentMutation,
  useCreateCrowdfundingMutation,
  useCreateEventMutation,
  useCreateMemberPlanMutation,
  useCreateNavigationMutation,
  useCreatePageMutation,
  useCreatePaymentMethodMutation,
  useCreateSubscriptionMutation,
  useCreateTagMutation,
  useDeleteArticleMutation,
  useDeleteAuthorMutation,
  useDeleteBlockStyleMutation,
  useDeleteCommentMutation,
  useDeleteEventMutation,
  useDeleteImageMutation,
  useDeleteMemberPlanMutation,
  useDeleteNavigationMutation,
  useDeletePageMutation,
  useDeletePaymentMethodMutation,
  useDeleteSubscriptionFlowMutation,
  useDeleteSubscriptionMutation,
  useDeleteTagMutation,
  useMarkInvoiceAsPaidMutation,
  usePublishArticleMutation,
  usePublishPageMutation,
  useRenewSubscriptionMutation,
  UserListDocument,
  useUpdateArticleMutation,
  useUpdateCommentMutation,
  useUpdateTagMutation,
  useUploadImageMutation,
} from '@wepublish/editor/api';
import {
  getImgMinSizeToCompress,
  getOperationNameFromDocument,
} from '@wepublish/ui/editor';
import imageCompression from 'browser-image-compression';
import { useEffect, useState } from 'react';
import { Descendant } from 'slate';

import imageData from './image-data.json';
import { useQueryState } from './useQueryState';

// ────────────────────────────────────────────────────────────────────────────
// Project-specific constants
// ────────────────────────────────────────────────────────────────────────────

/** Must exactly match `EeNewsBlockType` in apps/eenews/src/components/block-styles/eenews-block-styles.ts */
const EENEWS_BLOCK_STYLES = [
  { name: 'FlexBlockSectionBand', blocks: ['FlexBlock'] },
  { name: 'TopNewsCarousel', blocks: ['TeaserSlots'] },
  { name: 'AktuellGrid', blocks: ['TeaserSlots'] },
  { name: 'DossierGrid', blocks: ['TeaserSlots'] },
  { name: 'RelatedGrid', blocks: ['TeaserSlots', 'TeaserList'] },
  { name: 'TagFilterableGrid', blocks: ['TeaserSlots'] },
  { name: 'AuthorList', blocks: ['TeaserSlots'] },
  { name: 'SectionHead', blocks: ['TeaserSlots'] },
  { name: 'ArticleSupportCallout', blocks: ['LinkPageBreak'] },
  { name: 'ArticleShareRow', blocks: ['LinkPageBreak'] },
  { name: 'RichTextLead', blocks: ['RichText'] },
] as const;

/** Tags per v3 system design §8.
 *  - 5 themes (Tag.main = true) — uniform tag-chip mint color
 *  - 11 dossiers (Tag.main = false) — per-tag hex from prototype `TAG_COLORS`
 *  - 1 region tag for the Welt / international home (used by `/a/tag/international`)
 *
 * Storage is lowercase. The `tag` value is exactly the slug substring used
 * in `/a/tag/[slug]`. Display capitalisation happens in the UI layer.
 */
const EENEWS_TAGS = [
  // Themes (main = true, mint chip color)
  { tag: 'solar', main: true, color: '#baf09c' },
  { tag: 'wind', main: true, color: '#baf09c' },
  { tag: 'wasser', main: true, color: '#baf09c' },
  { tag: 'biomasse', main: true, color: '#baf09c' },
  { tag: 'erneuerbare', main: true, color: '#baf09c' },
  // Region (main = false; serves the Welt home at /a/tag/international)
  { tag: 'international', main: false, color: '#90E3FF' },
  // Dossiers (main = false; per-tag hex from prototype TAG_COLORS)
  { tag: 'articles en français', main: false, color: '#BAF09C' },
  { tag: 'the smarter e', main: false, color: '#90E3FF' },
  { tag: 'batterien', main: false, color: '#FFB7B9' },
  { tag: 'mobilität', main: false, color: '#E2D6F2' },
  { tag: 'fossile energien', main: false, color: '#D2C2A3' },
  { tag: 'energiestrategie 2050', main: false, color: '#FFD868' },
  { tag: 'bauen', main: false, color: '#E0D2B8' },
  { tag: 'bücher', main: false, color: '#F2C9D9' },
  { tag: 'akw-debatte', main: false, color: '#FF8E80' },
  { tag: 'klima', main: false, color: '#C9E8DD' },
  { tag: 'aeesuisse', main: false, color: '#BAF09C' },
] as const;

const ARTICLES_PER_TAG = 8;

/** sha256("ee-news-seed-2026") — change before committing if you want a different password. */
const SEED_PASSWORD_SHA256 =
  '512bb61e029c56fedb857d55a4dad19d87c7636c627e7f585bc3a243cf2d8add';

// ────────────────────────────────────────────────────────────────────────────
// Helpers (boilerplate — same shape across projects)
// ────────────────────────────────────────────────────────────────────────────

const shuffle = <T,>(list: T[]): T[] => {
  let idx = -1;
  const len = list.length;
  let position;
  const result: T[] = [];
  while (++idx < len) {
    position = Math.floor((idx + 1) * Math.random());
    result[idx] = result[position];
    result[position] = list[idx];
  }
  return result;
};

const pickRandom = <T,>(value: T, chance = 0.5): T[] | never[] => {
  return Math.random() > chance ? [] : [value];
};

const getText = (min = 1, max = 10): Descendant[] =>
  Array.from({ length: faker.number.int({ min, max }) }, () => ({
    type: 'paragraph',
    children: [{ text: faker.lorem.paragraph() }],
  })) as Descendant[];

const waitForMs = async (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

const getBlockStyle = (
  blockStyles: BlockStyle[],
  name: string
): string | undefined => blockStyles.find(s => s.name === name)?.id;

// ────────────────────────────────────────────────────────────────────────────
// Image upload + resize (boilerplate)
// ────────────────────────────────────────────────────────────────────────────

async function resizeImage(file: File): Promise<File> {
  const min = getImgMinSizeToCompress();
  if (file.size / (1024 * 1024) <= min) return file;
  return imageCompression(file, { maxSizeMB: min });
}

async function seedImages(
  uploadImage: ReturnType<typeof useUploadImageMutation>[0]
) {
  console.log('Seeding images...');
  const ids: string[] = [];
  for await (const img of imageData) {
    const file = new File(
      [await fetch(img.download_url).then(r => r.blob())],
      `image${img.id}.jpg`,
      { type: 'image/jpg' }
    );
    const optimized = await resizeImage(file);
    const { data } = await uploadImage({
      variables: {
        file: optimized,
        filename: `image${img.id}.jpg`,
        title: img.author,
        description: faker.lorem.sentence(),
        tags: [],
        source: img.url,
        link: faker.internet.url(),
        license: faker.lorem.word(),
        focalPointX: 0,
        focalPointY: 0,
      },
    });
    await waitForMs(200);
    if (data?.uploadImage?.id) ids.push(data.uploadImage.id);
  }
  return ids;
}

// ────────────────────────────────────────────────────────────────────────────
// Tags (project-specific)
// ────────────────────────────────────────────────────────────────────────────

async function seedTags(createTag: any, updateTag: any) {
  // The editor's `CreateTag` mutation does NOT accept the `main` flag — only
  // `tag`, `description`, `type`, `color` (see `libs/editor/api/.../tag.graphql`).
  // We must therefore set `main` via `UpdateTag` after creation.
  const created = await Promise.all(
    EENEWS_TAGS.map(t =>
      createTag({
        variables: {
          tag: t.tag,
          type: TagType.Article,
          description: [],
          color: t.color ?? undefined,
        },
      })
    )
  );

  // Patch `main` on tags that need it. We tolerate any tags whose flag is
  // already correct (idempotent) by always issuing the update.
  await Promise.all(
    created.map((res, i) => {
      const tagId = res?.data?.createTag?.id;
      if (!tagId) {
        return Promise.resolve();
      }
      const t = EENEWS_TAGS[i];
      return updateTag({
        variables: {
          id: tagId,
          main: t.main,
          color: t.color ?? undefined,
        },
      });
    })
  );

  return created;
}

// ────────────────────────────────────────────────────────────────────────────
// Authors (boilerplate — count is consistent across projects)
// ────────────────────────────────────────────────────────────────────────────

async function seedAuthors(createAuthor: any, imageIds: string[] = []) {
  const SOCIAL = [
    'github',
    'reddit',
    'discord',
    'youtube',
    'twitter',
    'tiktok',
    'facebook',
    'instagram',
    'linkedin',
    'email',
    'website',
  ];
  return Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const name = faker.person.fullName();
      const slug = faker.helpers.slugify(name.toLowerCase());
      const accounts = [...SOCIAL];
      return createAuthor({
        variables: {
          name,
          slug,
          bio: getText(1, 2) as Descendant[],
          jobTitle: faker.person.jobTitle(),
          imageID: imageIds[imageIds.length - 1 - i],
          links: Array.from(
            { length: faker.number.int({ min: 1, max: 5 }) },
            () => {
              const account = accounts.splice(
                Math.floor(Math.random() * accounts.length),
                1
              )[0];
              return {
                title: account,
                url:
                  account === 'email' ?
                    faker.internet.email()
                  : faker.internet.url(),
              };
            }
          ),
          tagIds: [],
          hideOnArticle: false,
          hideOnTeaser: false,
          hideOnTeam: false,
        },
      });
    })
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Articles (project-specific block composition)
// ────────────────────────────────────────────────────────────────────────────

const createArticleBlocks = (
  imageIds: string[],
  i: number,
  blockStyles: BlockStyle[],
  title: string
): BlockContentInput[] => {
  const heroImageId = imageIds[i % imageIds.length];
  const calloutStyleId = getBlockStyle(blockStyles, 'RichTextBlockCallout');

  const blocks: BlockContentInput[] = [
    {
      title: {
        title,
        preTitle: capitalize(faker.lorem.words({ min: 2, max: 4 })),
        lead: faker.lorem.sentences({ min: 2, max: 4 }),
      } as TitleBlockInput,
    },
    {
      image: {
        imageID: heroImageId,
        caption: faker.lorem.sentence(),
      } as ImageBlockInput,
    },
    // 5–9 alternating richText (heading-three + paragraphs) and occasional image
    ...Array.from(
      { length: faker.number.int({ min: 5, max: 9 }) },
      (_, k): BlockContentInput => {
        if (k % 4 === 3) {
          return {
            image: {
              imageID:
                imageIds[
                  faker.number.int({ min: 0, max: imageIds.length - 1 })
                ],
              caption: faker.lorem.sentence(),
            } as ImageBlockInput,
          };
        }
        return {
          richText: {
            richText: [
              {
                type: 'heading-three',
                children: [
                  {
                    text: capitalize(faker.lorem.words({ min: 3, max: 7 })),
                  },
                ],
              } as Descendant,
              ...(getText(2, 4) as Descendant[]),
            ],
          } as RichTextBlockInput,
        };
      }
    ),
    // 1 callout aside (RichTextBlockCallout block-style)
    {
      richText: {
        blockStyle: calloutStyleId,
        richText: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Unabhängiger Energie-Journalismus braucht Unterstützung. Werden Sie Mitglied bei ee-news und sichern Sie sich Zugang zu unseren Recherchen.',
              },
            ],
          } as Descendant,
        ],
      } as RichTextBlockInput,
    },
    // 1–3 closing paragraphs
    ...Array.from(
      { length: faker.number.int({ min: 1, max: 3 }) },
      (): BlockContentInput => ({
        richText: {
          richText: getText(2, 4),
        } as RichTextBlockInput,
      })
    ),
  ];
  return blocks;
};

const createArticleInput = (
  tagIds: string[],
  authorIds: string[],
  imageIds: string[],
  i: number,
  blockStyles: BlockStyle[],
  isFeatured: boolean
) => {
  const title =
    isFeatured ?
      'Wie die Schweiz ihr Stromnetz fit für 2035 macht — und wo es klemmt'
    : capitalize(faker.lorem.words({ min: 4, max: 8 }));
  const slug =
    isFeatured ? 'feature-netz' : (
      `${faker.helpers.slugify(title.toLowerCase())}-${i}`
    );
  const tagIndex = i % tagIds.length;
  const primaryTag = tagIds[tagIndex];
  const secondaryTag =
    Math.random() > 0.5 ?
      tagIds[(tagIndex + faker.number.int({ min: 1, max: 4 })) % tagIds.length]
    : null;

  return {
    variables: {
      shared: true,
      slug,
      publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      preTitle: capitalize(faker.lorem.words({ min: 2, max: 4 })),
      title,
      lead:
        isFeatured ?
          'Zwischen kantonalem Föderalismus, Solar-Boom und Lieferkettenkrise: ein nüchterner Blick auf die Engpässe, die niemand auf dem LinkedIn-Profil hat.'
        : faker.lorem.sentences({ min: 1, max: 2 }),
      seoTitle: `SEO – ${title}`,
      authorIds: [shuffle(authorIds).at(0)],
      imageID: imageIds[i % imageIds.length],
      breaking: pickRandom(true, 0.1).length ? true : false,
      paywallId: null,
      hidden: false,
      disableComments: false,
      tagIds: [primaryTag, ...(secondaryTag ? [secondaryTag] : [])],
      canonicalUrl: faker.internet.url(),
      properties: [
        {
          key: 'readTimeMin',
          value: String(faker.number.int({ min: 4, max: 9 })),
          public: true,
        },
        {
          key: 'topic',
          value: EENEWS_TAGS[tagIndex % EENEWS_TAGS.length].tag.toLowerCase(),
          public: true,
        },
      ] as PropertyInput[],
      blocks: createArticleBlocks(imageIds, i, blockStyles, title),
      hideAuthor: false,
      socialMediaTitle: `Social Media – ${title}`,
      socialMediaDescription: faker.lorem.paragraph(),
      socialMediaAuthorIds: [],
      socialMediaImageID: undefined,
      likes: 0,
    } as CreateArticleMutationVariables,
  };
};

async function seedArticles(
  createArticle: any,
  updateArticle: any,
  tagIds: string[],
  authorIds: string[],
  imageIds: string[],
  blockStyles: BlockStyle[]
) {
  const totalCount = tagIds.length * ARTICLES_PER_TAG; // = 80

  // First article = featured (slug `feature-netz`); the rest are random.
  const articles = [];
  for (let i = 0; i < totalCount; i++) {
    const input = createArticleInput(
      tagIds,
      authorIds,
      imageIds,
      i,
      blockStyles,
      i === 0 // first one is featured
    );
    const created = await createArticle(input);
    const updated = await updateArticle({
      variables: {
        id: created.data.createArticle.id,
        ...input.variables,
      },
    });
    articles.push(updated.data.updateArticle);
  }
  return articles;
}

// ────────────────────────────────────────────────────────────────────────────
// Navigations (project-specific)
// ────────────────────────────────────────────────────────────────────────────

async function seedNavigations(createNavigation: any) {
  // One nav per mega-menu / footer column, per v3 system design §7.
  // Components consume `NavigationListQuery` data via NavbarContainer /
  // FooterContainer and filter by `key`. **No literal labels in component
  // source.** Adding / renaming entries here is the only way to change the
  // navbar / footer.
  const ext = (label: string, url: string) => ({
    type: NavigationLinkType.External,
    label,
    url,
  });

  return Promise.all([
    // Bottom nav strip — 5 themes + Dossiers entry
    createNavigation({
      variables: {
        key: 'main',
        name: 'Hauptnavigation (Themen + Dossiers)',
        links: [
          ext('Solar', '/a/tag/solar'),
          ext('Wind', '/a/tag/wind'),
          ext('Wasser', '/a/tag/wasser'),
          ext('Biomasse', '/a/tag/biomasse'),
          ext('Erneuerbare', '/a/tag/erneuerbare'),
          ext('Dossiers', '/a/tag'),
        ],
      },
    }),

    // Topbar utility row — Newsletter + Mein Konto
    createNavigation({
      variables: {
        key: 'header',
        name: 'Topbar utility row',
        links: [ext('Newsletter', '/mitmachen'), ext('Mein Konto', '/profile')],
      },
    }),

    // Mega menu — Themen column (5 themes only; Dossiers is its own column)
    createNavigation({
      variables: {
        key: 'mega-themen',
        name: 'Themen',
        links: [
          ext('Solar', '/a/tag/solar'),
          ext('Wind', '/a/tag/wind'),
          ext('Wasser', '/a/tag/wasser'),
          ext('Biomasse', '/a/tag/biomasse'),
          ext('Erneuerbare', '/a/tag/erneuerbare'),
        ],
      },
    }),

    // Mega menu — Dossiers column (11 dossier tags; renderer splits into 2 sub-cols)
    createNavigation({
      variables: {
        key: 'mega-dossiers',
        name: 'Dossiers',
        links: [
          ext('Articles en français', '/a/tag/articles%20en%20fran%C3%A7ais'),
          ext('aeesuisse', '/a/tag/aeesuisse'),
          ext('The Smarter E', '/a/tag/the%20smarter%20e'),
          ext('Energiestrategie 2050', '/a/tag/energiestrategie%202050'),
          ext('Bauen', '/a/tag/bauen'),
          ext('Bücher', '/a/tag/b%C3%BCcher'),
          ext('Batterien', '/a/tag/batterien'),
          ext('AKW-Debatte', '/a/tag/akw-debatte'),
          ext('Mobilität', '/a/tag/mobilit%C3%A4t'),
          ext('Fossile Energien', '/a/tag/fossile%20energien'),
          ext('Klima', '/a/tag/klima'),
        ],
      },
    }),

    // Mega menu — Region column (CH = home, International = international tag, FR articles tag)
    createNavigation({
      variables: {
        key: 'mega-region',
        name: 'Region',
        links: [
          ext('Schweiz', '/'),
          ext('International', '/a/tag/international'),
          ext('Articles en français', '/a/tag/articles%20en%20fran%C3%A7ais'),
        ],
      },
    }),

    // Mega menu — ee-news column (about / authors / archive / newsletter / unterstützen)
    createNavigation({
      variables: {
        key: 'mega-about',
        name: 'ee-news',
        links: [
          ext('Über ee-news', '/about'),
          ext('Newsletter bestellen', '/mitmachen'),
        ],
      },
    }),

    // Mega menu — ee-news secondary (impressum / agb / datenschutz) — heading is empty (rendered as sub-list under col 4)
    createNavigation({
      variables: {
        key: 'mega-about-secondary',
        name: '',
        links: [
          ext('Impressum', '/impressum'),
          ext('AGB', '/agb'),
          ext('Datenschutzerklärung', '/impressum#datenschutz'),
        ],
      },
    }),

    // Footer column 2 — Themen
    createNavigation({
      variables: {
        key: 'footer-themen',
        name: 'Themen',
        links: [
          ext('Solar', '/a/tag/solar'),
          ext('Wind', '/a/tag/wind'),
          ext('Wasser', '/a/tag/wasser'),
          ext('Biomasse', '/a/tag/biomasse'),
          ext('Erneuerbare', '/a/tag/erneuerbare'),
          ext('Dossiers', '/a/tag'),
        ],
      },
    }),

    // Footer column 3 — Magazin
    createNavigation({
      variables: {
        key: 'footer-magazin',
        name: 'Footer · Magazin',
        links: [
          ext('Archiv', '/a'),
          ext('Autor·innen', '/author'),
          ext('Über ee-news', '/about'),
          ext('Mitmachen', '/mitmachen'),
          ext('Suche', '/search'),
        ],
      },
    }),

    // Footer column 4 — Konto
    createNavigation({
      variables: {
        key: 'footer-konto',
        name: 'Footer · Konto',
        links: [
          ext('Mein Konto', '/profile'),
          ext('Impressum', '/impressum'),
          ext('AGB', '/agb'),
          ext('Datenschutz', '/impressum#datenschutz'),
        ],
      },
    }),
  ]);
}

// ────────────────────────────────────────────────────────────────────────────
// Pages (project-specific composition matching v2 design)
// ────────────────────────────────────────────────────────────────────────────

/**
 * v3 home page composition: Top-News carousel (9 slots, paged 3-per-page) →
 * Aktuell grid (6 slots, region-filtered) → Dossier grid (6 slots, autofill from
 * non-main dossier tags). The same composition serves the optional CH-vs-Welt
 * variants, with `regionFilterTagIds` controlling whether the home autofills
 * Schweiz (= empty filter, default) or International (= filter by `international`
 * tag id) etc.
 */
function composeHomeBlocks(
  blockStyles: BlockStyle[],
  regionFilterTagIds: string[],
  dossierTagIds: string[]
): BlockContentInput[] {
  const autoSlot = (n: number) =>
    Array.from(
      { length: n },
      () => ({ type: 'Autofill', teaser: null }) as TeaserSlotInput
    );

  return [
    // Top-News carousel — 9 latest, region-filtered, paginated 3-per-page in the block component.
    {
      teaserSlots: {
        title: 'Top-News',
        blockStyle: getBlockStyle(blockStyles, 'TopNewsCarousel'),
        autofillConfig: {
          enabled: true,
          filter: regionFilterTagIds.length ? { tags: regionFilterTagIds } : {},
          teaserType: TeaserType.Article,
          sort: TeaserListBlockSort.PublishedAt,
        } as TeaserSlotsAutofillConfig,
        slots: autoSlot(9),
      } as TeaserSlotsBlockInput,
    },

    // Aktuell — 6 latest, region-filtered (same filter as carousel; carousel renders 9 then
    // this grid renders the next 6 chronologically).
    {
      teaserSlots: {
        title: 'Aktuell',
        blockStyle: getBlockStyle(blockStyles, 'AktuellGrid'),
        autofillConfig: {
          enabled: true,
          filter: regionFilterTagIds.length ? { tags: regionFilterTagIds } : {},
          teaserType: TeaserType.Article,
          sort: TeaserListBlockSort.PublishedAt,
        } as TeaserSlotsAutofillConfig,
        slots: autoSlot(6),
      } as TeaserSlotsBlockInput,
    },

    // Dossiers — 6 latest articles from any dossier (main=false) tag.
    {
      teaserSlots: {
        title: 'Dossiers',
        blockStyle: getBlockStyle(blockStyles, 'DossierGrid'),
        autofillConfig: {
          enabled: true,
          filter: { tags: dossierTagIds },
          teaserType: TeaserType.Article,
          sort: TeaserListBlockSort.PublishedAt,
        } as TeaserSlotsAutofillConfig,
        slots: autoSlot(6),
      } as TeaserSlotsBlockInput,
    },
  ];
}

async function seedPages(
  createPage: any,
  blockStyles: BlockStyle[],
  tags: Tag[]
) {
  const tagId = (name: string) => tags.find(t => t.tag === name)?.id ?? '';

  // Dossier tag IDs feed the home `DossierGrid` autofill block. Per v3 system
  // design §8 — dossiers are all main:false tags. We list them explicitly here
  // (rather than computing main!==true at seed time) because:
  //   1. the order influences autofill teaser ordering (dossiers shuffle by recency anyway, so order is informational)
  //   2. surfacing the explicit list keeps the seed honest if the EENEWS_TAGS array drifts
  // The `international` region tag is NOT a dossier — it's region-only.
  const dossierTagIds = [
    'articles en français',
    'aeesuisse',
    'the smarter e',
    'energiestrategie 2050',
    'bauen',
    'bücher',
    'batterien',
    'akw-debatte',
    'mobilität',
    'fossile energien',
    'klima',
  ]
    .map(tagId)
    .filter(Boolean);

  // Schweiz home (slug "") — default landing page, no region filter.
  const home = await createPage({
    variables: {
      publishedAt: new Date().toISOString(),
      slug: '',
      tagIds: [],
      imageID: null,
      canonicalUrl: null,
      properties: [],
      title: 'ee-news — Erneuerbare Energien und Energieeffizienz',
      blocks: composeHomeBlocks(blockStyles, [], dossierTagIds),
    },
  });

  const richTextPara = (text: string): Descendant[] =>
    [{ type: 'paragraph', children: [{ text }] }] as Descendant[];

  // Über ee-news — about/index page
  const about = await createPage({
    variables: {
      publishedAt: new Date().toISOString(),
      slug: 'about',
      tagIds: [],
      imageID: null,
      canonicalUrl: null,
      properties: [],
      title: 'Über ee-news',
      blocks: [
        {
          title: {
            title: 'Über ee-news',
            preTitle: 'ee-news',
            lead: 'Unabhängiger Journalismus zu erneuerbaren Energien, Energieeffizienz und Klima — mit Fokus Schweiz, Blick auf die Welt.',
          } as TitleBlockInput,
        },
        {
          richText: {
            richText: richTextPara(
              'ee-news ist ein unabhängiges, werbefreies Online-Magazin. Wir berichten seit 2007 über die Schweizer und internationale Energiewende: Photovoltaik, Wind, Wasser, Biomasse, Effizienz, Mobilität, Politik, Forschung. Drei Viertel unserer Mittel kommen direkt von Leserinnen und Lesern.'
            ),
          } as RichTextBlockInput,
        },
        {
          richText: {
            richText: richTextPara(
              'Unsere Redaktion ist klein, unsere Recherche akribisch. Wer mitmacht, sichert diese Berichterstattung — Monat für Monat.'
            ),
          } as RichTextBlockInput,
        },
      ] as BlockContentInput[],
    },
  });

  const impressum = await createPage({
    variables: {
      publishedAt: new Date().toISOString(),
      slug: 'impressum',
      tagIds: [],
      imageID: null,
      canonicalUrl: null,
      properties: [],
      title: 'Impressum',
      blocks: [
        {
          title: {
            title: 'Impressum',
            preTitle: 'ee-news',
            lead: 'Verantwortlich für den Inhalt dieser Webseite.',
          } as TitleBlockInput,
        },
        {
          richText: {
            richText: richTextPara(
              'ee-news GmbH · Beispielstrasse 1 · 8000 Zürich · Schweiz. Geschäftsführung: redaktion@ee-news.ch · UID: CHE-123.456.789. Bei Fragen erreichen Sie uns per E-Mail an redaktion@ee-news.ch oder telefonisch unter +41 44 000 00 00.'
            ),
          } as RichTextBlockInput,
        },
        {
          richText: {
            richText: richTextPara(
              'Datenschutz: Wir verarbeiten personenbezogene Daten nach den Vorgaben des Schweizer Datenschutzgesetzes (DSG) und — soweit anwendbar — der EU-DSGVO. Details unter datenschutz@ee-news.ch.'
            ),
          } as RichTextBlockInput,
        },
      ] as BlockContentInput[],
    },
  });

  const agb = await createPage({
    variables: {
      publishedAt: new Date().toISOString(),
      slug: 'agb',
      tagIds: [],
      imageID: null,
      canonicalUrl: null,
      properties: [],
      title: 'Allgemeine Geschäftsbedingungen',
      blocks: [
        {
          title: {
            title: 'AGB',
            preTitle: 'ee-news',
            lead: 'Allgemeine Geschäftsbedingungen für Mitgliedschaften und Newsletter-Abonnement.',
          } as TitleBlockInput,
        },
        {
          richText: {
            richText: getText(3, 5),
          } as RichTextBlockInput,
        },
      ] as BlockContentInput[],
    },
  });

  // The mitmachen page hero, title and lead are rendered directly in
  // `apps/eenews/pages/mitmachen.tsx` (wrapping the OOTB SubscribePage). The
  // CMS page exists so editors can append supplementary body content (FAQ,
  // legal copy, etc.) — it renders at the bottom of the page via
  // <PageContainer slug="mitmachen"> after the subscribe form. Seeded with
  // a single optional richtext paragraph; can be extended in the editor.
  const mitmachen = await createPage({
    variables: {
      publishedAt: new Date().toISOString(),
      slug: 'mitmachen',
      tagIds: [],
      imageID: null,
      canonicalUrl: null,
      properties: [],
      title: 'Mitmachen',
      blocks: [
        {
          richText: {
            richText: richTextPara(
              'Mitglieder erhalten den wöchentlichen Newsletter, exklusive Hintergrundartikel und Einladungen zu Recherche-Gesprächen. Beiträge sind steuerlich abzugsfähig.'
            ),
          } as RichTextBlockInput,
        },
      ] as BlockContentInput[],
    },
  });

  return [home, about, impressum, agb, mitmachen];
}

/**
 * Seed CMS stub pages used by MemberPlan.successPage / failPage / confirmationPage.
 * Slugs map to the custom Next.js routes in apps/eenews/pages/. The CMS page
 * exists only so wepublish has a Page entity it can reference; the actual UI is
 * served by the Next.js page that takes precedence over the [slug].tsx
 * catch-all.
 *
 * See `eenews-system-design.md` Section 10.6 (membership / payment-failed flow).
 */
async function seedPaymentResultPages(createPage: any) {
  const stubBlock = (title: string, lead: string): BlockContentInput[] =>
    [
      {
        title: {
          title,
          preTitle: 'Mitgliedschaft',
          lead,
        } as TitleBlockInput,
      },
    ] as BlockContentInput[];

  const successPage = await createPage({
    variables: {
      publishedAt: new Date().toISOString(),
      slug: 'payment-success',
      tagIds: [],
      imageID: null,
      canonicalUrl: null,
      properties: [],
      title: 'Zahlung erfolgreich',
      blocks: stubBlock(
        'Danke!',
        'Deine Mitgliedschaft ist aktiv. Wir freuen uns, dass du dabei bist.'
      ),
    },
  });

  const failPage = await createPage({
    variables: {
      publishedAt: new Date().toISOString(),
      slug: 'payment-failed',
      tagIds: [],
      imageID: null,
      canonicalUrl: null,
      properties: [],
      title: 'Zahlung fehlgeschlagen',
      blocks: stubBlock(
        'Wir konnten deine Zahlung nicht abbuchen.',
        'Bitte überprüfe deine Zahlart oder begleiche die Rechnung manuell.'
      ),
    },
  });

  const confirmationPage = await createPage({
    variables: {
      publishedAt: new Date().toISOString(),
      slug: 'payment-confirmation',
      tagIds: [],
      imageID: null,
      canonicalUrl: null,
      properties: [],
      title: 'Bestätigung ausstehend',
      blocks: stubBlock(
        'Bitte bestätige deine Anmeldung.',
        'Du erhältst eine E-Mail mit einem Bestätigungslink.'
      ),
    },
  });

  return {
    successPageId: successPage.data.createPage.id,
    failPageId: failPage.data.createPage.id,
    confirmationPageId: confirmationPage.data.createPage.id,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Events (boilerplate count, project-specific names)
// ────────────────────────────────────────────────────────────────────────────

async function seedEvents(createEvent: any, imageIds: string[]) {
  const future = faker.date.future();
  const titles = [
    'Solarpflicht — was bringt sie wirklich?',
    'Speicher-Forum 2026',
    'Mobilitätswende: Werkstattgespräch',
    'Energieeffizienz im Bestand',
    'Stromnetz und Föderalismus',
    'Wärmepumpen-Update',
    'Politik trifft Forschung',
    'Wasserkraft in der Klimakrise',
  ];
  return Promise.all(
    Array.from({ length: faker.number.int({ min: 4, max: 8 }) }, (_, i) =>
      createEvent({
        variables: {
          name: titles[i % titles.length],
          description: getText(4, 8) as any,
          startsAt: future,
          endsAt: faker.date.future({ refDate: future }),
          imageId: shuffle(imageIds).at(0),
        },
      })
    )
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Comments (boilerplate)
// ────────────────────────────────────────────────────────────────────────────

async function seedComments(
  createComment: any,
  updateComment: any,
  approveComment: any,
  articleIds: string[],
  imageIds: string[]
) {
  // Volume knobs — sized to fit comfortably under the staging API's
  // rate-limiter / connection pool. The earlier all-articles + Promise.all
  // fan-out produced ~9.6k in-flight mutations and tripped 503/520 (which
  // browsers surface as CORS errors). Demo intent: a few articles have
  // comment threads, the rest don't — that's enough to show the article
  // detail's comment block in the v2 design without seeding 80 forums.
  const COMMENTED_ARTICLES = Math.min(articleIds.length, 8);
  const TOP_MIN = 1;
  const TOP_MAX = 4;
  const REPLY_MIN = 0;
  const REPLY_MAX = 2;
  // Pause between mutations — generous enough that no burst lands in the
  // upstream rate limiter's window. Each comment is 3 mutations
  // (create + update + approve), so 30ms × 3 = ~90ms minimum per comment.
  // For ~8 articles × ~10 mutations max each ≈ 80 mutations ≈ 7s total.
  const STAGGER_MS = 30;

  const create = async (vars: {
    text: Descendant[];
    itemID: string;
    parentID: string | null;
    guestUsername: string;
    guestUserImageID: string | undefined;
    source: string;
  }) => {
    const c = await createComment({
      variables: {
        text: vars.text,
        tagIds: [],
        itemID: vars.itemID,
        parentID: vars.parentID,
        itemType: CommentItemType.Article,
      },
    });
    await waitForMs(STAGGER_MS);
    const id = c.data.createComment.id;
    await updateComment({
      variables: {
        id,
        guestUsername: vars.guestUsername,
        guestUserImageID: vars.guestUserImageID,
        source: vars.source,
      },
    });
    await waitForMs(STAGGER_MS);
    await approveComment({ variables: { id } });
    await waitForMs(STAGGER_MS);
    return c;
  };

  const out: Awaited<ReturnType<typeof create>>[][] = [];
  // Sample N articles instead of touching all of them — enough to populate
  // the comment-thread view in the v2 article detail without flooding.
  const targets = articleIds.slice(0, COMMENTED_ARTICLES);
  for (const articleId of targets) {
    const top: Awaited<ReturnType<typeof create>>[] = [];
    const topCount = faker.number.int({ min: TOP_MIN, max: TOP_MAX });
    for (let i = 0; i < topCount; i++) {
      top.push(
        await create({
          text: getText(2, 4) as Descendant[],
          itemID: articleId,
          parentID: null,
          guestUsername: faker.person.fullName(),
          guestUserImageID: shuffle(imageIds).at(0),
          source: capitalize(faker.lorem.words({ min: 3, max: 6 })),
        })
      );
    }
    const replies: Awaited<ReturnType<typeof create>>[] = [];
    for (const parent of top) {
      const replyCount = faker.number.int({
        min: REPLY_MIN,
        max: REPLY_MAX,
      });
      for (let i = 0; i < replyCount; i++) {
        replies.push(
          await create({
            text: getText(1, 3) as Descendant[],
            itemID: articleId,
            parentID: parent.data.createComment.id,
            guestUsername: faker.person.fullName(),
            guestUserImageID: shuffle(imageIds).at(0),
            source: capitalize(faker.lorem.words({ min: 3, max: 6 })),
          })
        );
      }
    }
    out.push([...top, ...replies]);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Member plans + payment methods (boilerplate)
// ────────────────────────────────────────────────────────────────────────────

async function seedPaymentMethods(createPaymentMethod: any) {
  return Promise.all([
    createPaymentMethod({
      variables: {
        name: 'Payrexx',
        slug: 'payrexx',
        description: '',
        paymentProviderID: 'payrexx',
        gracePeriod: 7,
        imageId: null,
        active: true,
      },
    }),
    createPaymentMethod({
      variables: {
        name: 'Stripe',
        slug: 'stripe',
        description: '',
        paymentProviderID: 'stripe',
        gracePeriod: 7,
        imageId: null,
        active: true,
      },
    }),
  ]);
}

async function seedMemberPlans(
  createMemberPlan: any,
  paymentMethods: any[],
  paymentResultPageIds: {
    successPageId: string;
    failPageId: string;
    confirmationPageId: string;
  }
) {
  // Three v2 plans (per Mitmachen design):
  //   • Mitlesen — CHF 9/Monat (basic, ghost-style card)
  //   • Unterstützen — CHF 25/Monat (featured, dark card; tagged 'featured' so
  //     EenewsMemberPlanItem renders it dark)
  //   • Tragen — CHF 50+/Monat (solidarity, donation product type for variable amount)
  //
  // All three reference the same CMS stub pages for success/fail/confirmation
  // so the wepublish payment redirect logic routes through the v2 design.
  const allPaymentMethodIDs = paymentMethods.map(
    (p: any) => p.data.createPaymentMethod.id
  );
  const monthlyAndYearly = [
    {
      forceAutoRenewal: false,
      paymentMethodIDs: allPaymentMethodIDs,
      paymentPeriodicities: ['monthly', 'yearly'] as const,
    },
  ];

  return Promise.all([
    createMemberPlan({
      variables: {
        name: 'Mitlesen',
        slug: 'mitlesen',
        active: true,
        description: [],
        shortDescription: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Vollzugriff auf Artikel, Newsletter, das wöchentliche Energie-Briefing. Ohne Schnickschnack.',
              },
            ],
          } as Descendant,
        ],
        imageID: null,
        amountPerMonthMin: 900,
        productType: ProductType.Subscription,
        extendable: true,
        currency: 'CHF',
        tags: ['lesen'],
        availablePaymentMethods: monthlyAndYearly,
        ...paymentResultPageIds,
      },
    }),
    createMemberPlan({
      variables: {
        name: 'Unterstützen',
        slug: 'unterstuetzen',
        active: true,
        description: [],
        shortDescription: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Trägt unsere Recherche. Plus: Einladungen zu Salongesprächen, Werkstatt-Briefings der Redaktion, Vorab-Leseexemplare.',
              },
            ],
          } as Descendant,
        ],
        imageID: null,
        amountPerMonthMin: 2500,
        productType: ProductType.Subscription,
        extendable: true,
        currency: 'CHF',
        tags: ['featured', 'crowdfunding'],
        availablePaymentMethods: monthlyAndYearly,
        ...paymentResultPageIds,
      },
    }),
    createMemberPlan({
      variables: {
        name: 'Tragen',
        slug: 'tragen',
        active: true,
        description: [],
        shortDescription: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Für Leser·innen mit Mitteln. Trägt zwei reduzierte Mitgliedschaften gleich mit. Persönliche Würdigung im Impressum auf Wunsch.',
              },
            ],
          } as Descendant,
        ],
        imageID: null,
        amountPerMonthMin: 5000,
        productType: ProductType.Donation,
        extendable: true,
        currency: 'CHF',
        tags: ['solidaritaet'],
        availablePaymentMethods: monthlyAndYearly,
        ...paymentResultPageIds,
      },
    }),
  ]);
}

// ────────────────────────────────────────────────────────────────────────────
// Block styles (project-specific — matches EeNewsBlockType enum)
// ────────────────────────────────────────────────────────────────────────────

async function seedBlockStyles(createBlockStyle: any): Promise<BlockStyle[]> {
  const out: BlockStyle[] = [];
  for (const style of EENEWS_BLOCK_STYLES) {
    const r = await createBlockStyle({
      variables: { name: style.name, blocks: style.blocks },
    });
    out.push(r.data.createBlockStyle);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Crowdfunding (placeholder — used by mitmachen.html schema-mapping)
// ────────────────────────────────────────────────────────────────────────────

async function seedCrowdfunding(
  createCrowdfunding: any,
  memberPlans: Array<{ id: string; slug: string }>
) {
  // Anchor the live crowdfunding to the Unterstützen plan (slug 'unterstuetzen')
  // — that's the featured/dark plan in the v2 Mitmachen design and the one
  // tagged 'crowdfunding' in seedMemberPlans.
  const unterstuetzen = memberPlans.find(p => p.slug === 'unterstuetzen');
  if (!unterstuetzen) {
    console.warn(
      'seedCrowdfunding: unterstuetzen memberPlan not found — skipping.'
    );
    return null;
  }

  // Window matches the design "Frühjahrs-Aktion 2026" copy (campaign closes 30. Juni).
  const countSubscriptionsFrom = new Date('2026-01-01T00:00:00Z');
  const countSubscriptionsUntil = new Date('2026-06-30T23:59:59Z');

  // Amounts are stored in minor units (cents) — see crowdfunding-goal-list.tsx
  // (`centAmount={goal.amount}`). The resolver sums monthlyAmount × monthFactor
  // (cents) and adds additionalRevenue, so additionalRevenue is also cents.
  const goalAmountCents = 27_000_000; // CHF 270,000
  const baselineRevenueCents = 18_400_000; // CHF 184,000 — pre-seed history

  return createCrowdfunding({
    variables: {
      input: {
        name: 'Frühjahrs-Aktion 2026',
        goalType: CrowdfundingGoalType.Revenue,
        countSubscriptionsFrom: countSubscriptionsFrom.toISOString(),
        countSubscriptionsUntil: countSubscriptionsUntil.toISOString(),
        additionalRevenue: baselineRevenueCents,
        goals: [
          {
            title: 'Jahresziel 2026',
            description: 'Sichert die Recherche zur Schweizer Energiewende.',
            amount: goalAmountCents,
          },
        ],
        memberPlans: [{ id: unterstuetzen.id }],
      },
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Fetch-all helpers (boilerplate for delete pagination)
// ────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 100;
async function fetchPaginated(
  client: any,
  query: any,
  countPath: string[],
  nodesPath: string[],
  variables: Record<string, any> = {}
) {
  let skip = 0;
  const all: Array<{ id: string }> = [];
  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query,
      variables: { ...variables, take: PAGE_SIZE, skip },
      fetchPolicy: 'network-only',
    });
    const nodes = nodesPath.reduce<any>((acc, k) => acc?.[k], data) ?? [];
    all.push(...nodes.map((n: any) => ({ id: n.id })));
    const total = countPath.reduce<any>((acc, k) => acc?.[k], data);
    hasMore = total != null ? total > all.length : nodes.length === PAGE_SIZE;
    skip += PAGE_SIZE;
  }
  return all;
}

const fetchAllTags = (c: any) =>
  fetchPaginated(
    c,
    TagListDocument,
    ['tags', 'totalCount'],
    ['tags', 'nodes'],
    {
      filter: { type: TagType.Article },
    }
  );
const fetchAllAuthors = (c: any) =>
  fetchPaginated(
    c,
    AuthorListDocument,
    ['authors', 'totalCount'],
    ['authors', 'nodes']
  );
const fetchAllArticles = (c: any) =>
  fetchPaginated(
    c,
    ArticleListDocument,
    ['articles', 'totalCount'],
    ['articles', 'nodes']
  );
const fetchAllNavigations = (c: any) =>
  fetchPaginated(
    c,
    NavigationListDocument,
    ['navigations', 'length'],
    ['navigations']
  );
const fetchAllImages = (c: any) =>
  fetchPaginated(
    c,
    ImageListDocument,
    ['images', 'totalCount'],
    ['images', 'nodes']
  );
const fetchAllPages = (c: any) =>
  fetchPaginated(
    c,
    PageListDocument,
    ['pages', 'totalCount'],
    ['pages', 'nodes']
  );
const fetchAllEvents = (c: any) =>
  fetchPaginated(
    c,
    EventListDocument,
    ['events', 'totalCount'],
    ['events', 'nodes']
  );
const fetchAllBlockStyles = (c: any) =>
  fetchPaginated(
    c,
    BlockStylesDocument,
    ['blockStyles', 'length'],
    ['blockStyles']
  );
const fetchAllComments = (c: any) =>
  fetchPaginated(
    c,
    CommentListDocument,
    ['comments', 'totalCount'],
    ['comments', 'nodes'],
    {
      filter: {},
    }
  );
const fetchAllSubscriptions = (c: any) =>
  fetchPaginated(
    c,
    SubscriptionListDocument,
    ['subscriptions', 'totalCount'],
    ['subscriptions', 'nodes']
  );
const fetchAllMemberPlans = (c: any) =>
  fetchPaginated(
    c,
    MemberPlanListDocument,
    ['memberPlans', 'totalCount'],
    ['memberPlans', 'nodes']
  );
const fetchAllPaymentMethods = (c: any) =>
  fetchPaginated(
    c,
    PaymentMethodListDocument,
    ['paymentMethods', 'totalCount'],
    ['paymentMethods']
  );
const fetchAllSubscriptionFlows = (c: any) =>
  fetchPaginated(
    c,
    SubscriptionFlowsDocument,
    ['subscriptionFlows', 'totalCount'],
    ['subscriptionFlows'],
    { defaultFlowOnly: false, memberPlanID: null }
  );

// ────────────────────────────────────────────────────────────────────────────
// Delete (boilerplate)
// ────────────────────────────────────────────────────────────────────────────

async function handleDelete(
  deletes: {
    deleteTag: any;
    deleteAuthor: any;
    deleteArticle: any;
    deleteNavigation: any;
    deletePage: any;
    deleteImage: any;
    deleteEvent: any;
    deleteBlockStyle: any;
    deleteComment: any;
    deletePaymentMethod: any;
    deleteMemberPlan: any;
    deleteSubscriptionFlow: any;
    deleteSubscription: any;
  },
  client: any,
  params?: URLSearchParams
) {
  const excludeImages = params?.get('type') === 'exclude-images';
  const [
    tags,
    authors,
    articles,
    navigations,
    images,
    pages,
    events,
    blockStyles,
    comments,
    memberPlans,
    paymentMethods,
    subscriptionFlows,
    subscriptions,
  ] = await Promise.all([
    fetchAllTags(client),
    fetchAllAuthors(client),
    fetchAllArticles(client),
    fetchAllNavigations(client),
    excludeImages ? Promise.resolve([]) : fetchAllImages(client),
    fetchAllPages(client),
    fetchAllEvents(client),
    fetchAllBlockStyles(client),
    fetchAllComments(client),
    fetchAllMemberPlans(client),
    fetchAllPaymentMethods(client),
    fetchAllSubscriptionFlows(client),
    fetchAllSubscriptions(client),
  ]);

  await Promise.all(
    tags.map(t => deletes.deleteTag({ variables: { id: t.id } }))
  );
  await Promise.all(
    authors.map(a => deletes.deleteAuthor({ variables: { id: a.id } }))
  );
  await Promise.all(
    articles.map(a => deletes.deleteArticle({ variables: { id: a.id } }))
  );
  await Promise.all(
    navigations.map(n => deletes.deleteNavigation({ variables: { id: n.id } }))
  );
  if (!excludeImages) {
    await Promise.all(
      images.map(i => deletes.deleteImage({ variables: { id: i.id } }))
    );
  }
  await Promise.all(
    pages.map(p =>
      (p as any).slug === '404' ?
        Promise.resolve()
      : deletes.deletePage({ variables: { id: p.id } })
    )
  );
  await Promise.all(
    events.map(e => deletes.deleteEvent({ variables: { id: e.id } }))
  );
  await Promise.all(
    blockStyles.map(b => deletes.deleteBlockStyle({ variables: { id: b.id } }))
  );
  await Promise.all(
    comments.map(c =>
      deletes.deleteComment({ variables: { deleteCommentId: c.id } })
    )
  );
  await Promise.all(
    subscriptions.map(s =>
      deletes.deleteSubscription({ variables: { id: s.id } })
    )
  );
  await Promise.all(
    memberPlans.map(m => deletes.deleteMemberPlan({ variables: { id: m.id } }))
  );
  await Promise.all(
    paymentMethods.map(p =>
      deletes
        .deletePaymentMethod({ variables: { id: p.id } })
        .catch((err: unknown) => console.warn('payment-method delete:', err))
    )
  );
  await Promise.all(
    subscriptionFlows.map(f =>
      deletes
        .deleteSubscriptionFlow({ variables: { id: f.id } })
        .catch((err: unknown) => console.warn('subscription-flow delete:', err))
    )
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Test-user subscriptions + invoice history
// ────────────────────────────────────────────────────────────────────────────

/**
 * Seed subscriptions + invoice history for the user identified by `adminEmail`
 * (the user must already exist — this seed does NOT create users). Drives the
 * v2 /profile and /profile/subscription/[id] views.
 *
 * Strategy per `eenews-system-design.md` Section 10.6:
 *  – 3 active subscriptions (Mitgliedschaft Unterstützen monthly, Klima-Recherche
 *    donation one-off, Stiftungsabo Energiewende yearly).
 *  – Per subscription, call `renewSubscription` ~4–6 times to build a history.
 *  – Mark all but the latest invoice as paid → 1 unpaid + N paid in the table.
 *
 * Idempotent best-effort: if the user can't be found, log and skip so the seed
 * doesn't fail when run against a fresh API.
 */
async function seedAdminSubscriptions(
  client: any,
  createSubscription: any,
  renewSubscription: any,
  markInvoiceAsPaid: any,
  memberPlans: Array<{ id: string; slug: string; productType: string }>,
  paymentMethods: Array<{ id: string; slug: string }>,
  adminEmail: string
) {
  if (!adminEmail) {
    console.warn(
      'seedAdminSubscriptions: no admin email provided — skipping. Subscriptions/invoices will be empty in the v2 /profile view.'
    );
    return;
  }
  const userListResult = await client.query({
    query: UserListDocument,
    variables: {
      filter: { text: adminEmail },
      take: 1,
    },
  });
  const adminUser = userListResult?.data?.users?.nodes?.[0];
  if (!adminUser) {
    console.warn(
      `seedAdminSubscriptions: user "${adminEmail}" not found — skipping. Subscriptions/invoices will be empty in the v2 /profile view.`
    );
    return;
  }
  console.log(
    `seedAdminSubscriptions: seeding subscriptions for user ${adminUser.email} (${adminUser.id})`
  );

  // Re-runs may leave unpaid invoices on the admin user from a prior partial
  // seed. The API rejects new invoices while any are unpaid, so flush them.
  const existing = await client.query({
    query: InvoicesDocument,
    variables: { filter: { userID: adminUser.id }, take: 100 },
    fetchPolicy: 'no-cache',
  });
  const unpaidLeftovers = (existing?.data?.invoices?.nodes ?? []).filter(
    (inv: any) => !inv.paidAt && !inv.canceledAt
  );
  for (const inv of unpaidLeftovers) {
    await markInvoiceAsPaid({ variables: { id: inv.id } }).catch((err: any) =>
      console.warn(
        `seedAdminSubscriptions: pre-pay leftover invoice ${inv.id} failed:`,
        err?.message
      )
    );
  }

  const planBySlug = (slug: string) => memberPlans.find(p => p.slug === slug);
  const paymentMethodId = paymentMethods[0]?.id;
  if (!paymentMethodId) {
    console.warn(
      'seedAdminSubscriptions: no paymentMethod available — skipping.'
    );
    return;
  }

  const subs: Array<{
    plan: (typeof memberPlans)[number] | undefined;
    monthlyAmount: number;
    paymentPeriodicity: PaymentPeriodicity;
    startsAt: Date;
    renewals: number;
    autoRenew: boolean;
  }> = [
    {
      plan: planBySlug('unterstuetzen'),
      monthlyAmount: 2500,
      paymentPeriodicity: PaymentPeriodicity.Monthly,
      startsAt: new Date('2024-03-14T00:00:00Z'),
      renewals: 4,
      autoRenew: true,
    },
    {
      plan: planBySlug('mitlesen'),
      monthlyAmount: 900,
      paymentPeriodicity: PaymentPeriodicity.Yearly,
      startsAt: new Date('2024-01-10T00:00:00Z'),
      renewals: 2,
      autoRenew: true,
    },
    {
      plan: planBySlug('tragen'),
      monthlyAmount: 5000,
      paymentPeriodicity: PaymentPeriodicity.Monthly,
      startsAt: new Date('2024-12-22T00:00:00Z'),
      renewals: 1,
      autoRenew: false,
    },
  ];

  // The API rule (subscription.service.ts): renewSubscription rejects with
  // "You cant create new invoice while you have unpaid invoices!" if the
  // SUBSCRIPTION already has any unpaid invoice. Critically,
  // createSubscription itself produces an initial invoice (it calls
  // renewSubscriptionForUser internally). So after each createSubscription
  // we must pay the bootstrap invoice before requesting more renewals.
  const flushSubscriptionUnpaid = async (subId: string) => {
    const r = await client.query({
      query: InvoicesDocument,
      variables: { filter: { subscriptionID: subId }, take: 100 },
      fetchPolicy: 'no-cache',
    });
    const unpaid = (r?.data?.invoices?.nodes ?? []).filter(
      (inv: any) => !inv.paidAt && !inv.canceledAt
    );
    for (const inv of unpaid) {
      await markInvoiceAsPaid({ variables: { id: inv.id } }).catch((err: any) =>
        console.warn(
          `seedAdminSubscriptions: markInvoiceAsPaid failed for ${inv.id}:`,
          err?.message
        )
      );
    }
  };

  const subscriptionIds: string[] = [];
  for (const s of subs) {
    if (!s.plan) {
      console.warn(`seedAdminSubscriptions: missing memberPlan — skipping`);
      continue;
    }
    const created = await createSubscription({
      variables: {
        autoRenew: s.autoRenew,
        extendable: true,
        monthlyAmount: s.monthlyAmount,
        startsAt: s.startsAt.toISOString(),
        paidUntil: null,
        paymentPeriodicity: s.paymentPeriodicity,
        properties: [],
        userID: adminUser.id,
        paymentMethodID: paymentMethodId,
        memberPlanID: s.plan.id,
      },
    });
    const subId = created?.data?.createSubscription?.id;
    if (!subId) {
      console.warn('seedAdminSubscriptions: createSubscription returned no id');
      continue;
    }
    subscriptionIds.push(subId);
    await flushSubscriptionUnpaid(subId);
    for (let i = 0; i < s.renewals; i++) {
      await renewSubscription({ variables: { id: subId } }).catch((err: any) =>
        console.warn(
          `seedAdminSubscriptions: renewSubscription #${i + 1} failed:`,
          err?.message
        )
      );
      await flushSubscriptionUnpaid(subId);
    }
  }

  // Leave one final unpaid invoice on the first (featured) subscription so
  // /profile and the subscription-detail view render the open-invoice card.
  const featuredSubId = subscriptionIds[0];
  if (featuredSubId) {
    await renewSubscription({ variables: { id: featuredSubId } }).catch(
      (err: any) =>
        console.warn(
          'seedAdminSubscriptions: final unpaid renewSubscription failed:',
          err?.message
        )
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Seed orchestration
// ────────────────────────────────────────────────────────────────────────────

async function handleSeed(
  hooks: {
    uploadImage: any;
    createAuthor: any;
    createTag: any;
    updateTag: any;
    createBlockStyle: any;
    createArticle: any;
    publishArticle: any;
    updateArticle: any;
    createNavigation: any;
    createEvent: any;
    createPage: any;
    createComment: any;
    updateComment: any;
    approveComment: any;
    publishPage: any;
    createMemberPlan: any;
    createPaymentMethod: any;
    createSubscription: any;
    renewSubscription: any;
    markInvoiceAsPaid: any;
    createCrowdfunding: any;
  },
  client: any,
  params?: URLSearchParams,
  adminEmail = ''
) {
  // Skip modes — toggled via `?type=...` on the /seed route. Multiple modes
  // can be combined with `+` (e.g. `?type=exclude-images+exclude-tags`).
  // When a skip mode is on, the orchestrator fetches existing rows from the
  // CMS so downstream steps (article tagging, page composition, comments,
  // etc.) still have the IDs they need.
  const typeParam = params?.get('type') ?? '';
  const skipModes = new Set(typeParam.split(/[+,\s]+/).filter(Boolean));
  const excludeImages = skipModes.has('exclude-images');
  const excludeTags = skipModes.has('exclude-tags');
  const excludeArticles = skipModes.has('exclude-articles');

  const images =
    excludeImages ?
      (await fetchAllImages(client)).map(i => i.id)
    : await seedImages(hooks.uploadImage);

  const blockStyles = await seedBlockStyles(hooks.createBlockStyle);

  type TagMutationResult = { data: { createTag: Tag } };
  const tagResults: TagMutationResult[] | null =
    excludeTags ? null : await seedTags(hooks.createTag, hooks.updateTag);
  const tags: Tag[] =
    tagResults != null ?
      tagResults.map(r => r.data.createTag)
    : ((await fetchAllTags(client)) as Tag[]);

  const authors = await seedAuthors(hooks.createAuthor, images);
  const authorIds = authors.map(a => a.data.createAuthor.id);

  type ArticleRow = {
    id: string;
    publishedAt?: string | null;
    latest?: { publishedAt?: string | null };
  };
  const articlesResult: ArticleRow[] | null =
    excludeArticles ? null : (
      ((await seedArticles(
        hooks.createArticle,
        hooks.updateArticle,
        tags.map(t => t.id),
        authorIds,
        images,
        blockStyles
      )) as ArticleRow[])
    );
  const articles: ArticleRow[] =
    articlesResult != null ? articlesResult : (
      ((await fetchAllArticles(client)) as ArticleRow[])
    );

  // Publish all articles. When `excludeArticles` is on, articles fetched from
  // the CMS may already be published — skip the publish call to avoid a no-op
  // mutation flood.
  const published = [] as any[];
  for (const a of articles) {
    if (a?.latest?.publishedAt || a?.publishedAt) {
      published.push(a);
      continue;
    }
    const r = await hooks.publishArticle({
      variables: { id: a.id, publishedAt: new Date().toISOString() },
    });
    published.push(r.data.publishArticle);
  }

  // Featured article pins for the two home variants. CH gets the first
  // v3 home composition no longer pins a featured-lead teaser — Top-News
  // carousel autofills 9 latest, Aktuell grid the next 6, Dossiers another 6.
  // (The v2 featuredArticleId* pinning logic lived here.)

  await seedNavigations(hooks.createNavigation);
  await seedEvents(hooks.createEvent, images);

  const paymentMethods = await seedPaymentMethods(hooks.createPaymentMethod);

  // CMS pages must be created BEFORE member plans (member plans reference page
  // IDs for successPage / failPage / confirmationPage). The Next.js routes at
  // apps/eenews/pages/payment-success.tsx etc. take precedence over the
  // [slug].tsx catch-all so the page IDs effectively redirect to our custom
  // routes after a payment attempt.
  const paymentResultPageIds = await seedPaymentResultPages(hooks.createPage);
  const memberPlans = await seedMemberPlans(
    hooks.createMemberPlan,
    paymentMethods,
    paymentResultPageIds
  );
  await seedCrowdfunding(
    hooks.createCrowdfunding,
    memberPlans.map(r => r.data.createMemberPlan)
  );

  // Find the existing user (created by the wepublish CLI
  // bootstrap) and seed subscriptions + invoice history for them so the
  // /profile and /profile/subscription/[id] views render the v2 design.
  await seedAdminSubscriptions(
    client,
    hooks.createSubscription,
    hooks.renewSubscription,
    hooks.markInvoiceAsPaid,
    memberPlans.map(r => r.data.createMemberPlan),
    paymentMethods.map(p => p.data.createPaymentMethod),
    adminEmail
  );

  const pages = await seedPages(hooks.createPage, blockStyles, tags);
  for (const page of pages) {
    await hooks.publishPage({
      variables: {
        id: page.data.createPage.id,
        publishedAt: new Date().toISOString(),
      },
    });
  }
  // Publish payment-result stub pages too so they have URLs.
  for (const id of [
    paymentResultPageIds.successPageId,
    paymentResultPageIds.failPageId,
    paymentResultPageIds.confirmationPageId,
  ]) {
    await hooks.publishPage({
      variables: { id, publishedAt: new Date().toISOString() },
    });
  }

  // Comments seed: scoped to the first 8 articles, sequential mutations,
  // 30ms stagger between each. Sized to sit comfortably under staging's
  // rate-limiter (~80 mutations total ≈ 7s wall time).
  await seedComments(
    hooks.createComment,
    hooks.updateComment,
    hooks.approveComment,
    published.map(a => a?.id).filter(Boolean) as string[],
    images
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Password gate (boilerplate)
// ────────────────────────────────────────────────────────────────────────────

async function hashSHA256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function SeedSession({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState(() => {
    const s = localStorage.getItem('seed_session');
    return s ?? 'expired';
  });
  useEffect(() => {
    localStorage.setItem('seed_session', session || 'expired');
  }, [session]);

  const valid =
    session.startsWith('valid-') &&
    new Date().getTime() - new Date(session.split('valid-')[1]).getTime() <
      3600000;

  if (valid) return <>{children}</>;
  return (
    <div style={{ padding: 20 }}>
      <p>Please enter the seed password to proceed:</p>
      <input
        type="password"
        onKeyDown={async e => {
          if (e.key === 'Enter') {
            const hash = await hashSHA256(e.currentTarget.value);
            setSession(
              hash === SEED_PASSWORD_SHA256 ?
                `valid-${new Date().toISOString()}`
              : 'expired'
            );
          }
        }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Top-level component
// ────────────────────────────────────────────────────────────────────────────

export const Seed = () => {
  const client = getApiClientV2();

  const [deleteTag] = useDeleteTagMutation({ client });
  const [deleteAuthor] = useDeleteAuthorMutation({ client });
  const [deleteArticle] = useDeleteArticleMutation({ client });
  const [deleteNavigation] = useDeleteNavigationMutation({ client });
  const [deletePage] = useDeletePageMutation({ client });
  const [deleteImage] = useDeleteImageMutation({ client });
  const [deleteEvent] = useDeleteEventMutation({ client });
  const [deleteBlockStyle] = useDeleteBlockStyleMutation({ client });
  const [deleteComment] = useDeleteCommentMutation();
  const [deleteMemberPlan] = useDeleteMemberPlanMutation({ client });
  const [deletePaymentMethod] = useDeletePaymentMethodMutation({ client });
  const [deleteSubscriptionFlow] = useDeleteSubscriptionFlowMutation({
    client,
  });
  const [deleteSubscription] = useDeleteSubscriptionMutation();

  const [createTag] = useCreateTagMutation({ client });
  const [updateTag] = useUpdateTagMutation({ client });
  const [createAuthor] = useCreateAuthorMutation({ client });
  const [createArticle] = useCreateArticleMutation({ client });
  const [createPage] = useCreatePageMutation({ client });
  const [createNavigation] = useCreateNavigationMutation({ client });
  const [createEvent] = useCreateEventMutation({ client });
  const [uploadImage] = useUploadImageMutation({
    client,
    refetchQueries: [getOperationNameFromDocument(ImageListDocument)],
  });
  const [createBlockStyle] = useCreateBlockStyleMutation({
    variables: { blocks: [], name: '' },
    client,
  });
  const [createComment] = useCreateCommentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [approveComment] = useApproveCommentMutation();
  const [publishArticle] = usePublishArticleMutation({ client });
  const [publishPage] = usePublishPageMutation({ client });
  const [updateArticle] = useUpdateArticleMutation({ client });
  const [createMemberPlan] = useCreateMemberPlanMutation({ client });
  const [createPaymentMethod] = useCreatePaymentMethodMutation({ client });
  const [createSubscription] = useCreateSubscriptionMutation({ client });
  const [renewSubscription] = useRenewSubscriptionMutation({ client });
  const [markInvoiceAsPaid] = useMarkInvoiceAsPaidMutation({ client });
  const [createCrowdfunding] = useCreateCrowdfundingMutation({ client });

  const [params] = useQueryState<URLSearchParams>(
    new URLSearchParams(window.location.search)
  );

  // Admin email is the user that gets seeded subscriptions + invoices so the
  // v2 /profile + /profile/subscription/[id] views render real data. Empty
  // by default — type the address of an existing user before clicking
  // "Create Content". If left blank, the subscription/invoice step is skipped.
  const [adminEmail, setAdminEmail] = useState('');

  const SKIP_MODE_KEYS = [
    'exclude-images',
    'exclude-tags',
    'exclude-articles',
  ] as const;
  type SkipModeKey = (typeof SKIP_MODE_KEYS)[number];

  const currentSkipModes = new Set(
    (params?.get('type') ?? '').split(/[+,\s]+/).filter(Boolean)
  );

  function toggleSkipMode(
    key: SkipModeKey,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const next = new Set(currentSkipModes);
    if (e.currentTarget.checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    const query = next.size > 0 ? `?type=${[...next].join('+')}` : '';
    window.history.replaceState(
      { skipModes: [...next] },
      '',
      `${window.location.pathname}${query}`
    );
    window.dispatchEvent(new Event('popstate'));
  }

  return (
    <SeedSession>
      <div style={{ padding: 20 }}>
        <h2>EE News — CMS seed</h2>
        <p>
          This route fills the wepublish CMS with EE News-specific content
          matching the v2 design. The block-styles array exactly matches the
          <code>EeNewsBlockType</code> enum used in
          <code>
            apps/eenews/src/components/block-styles/eenews-block-styles.ts
          </code>
          .
        </p>

        <fieldset
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 4,
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          <legend style={{ fontSize: 13, padding: '0 6px', color: '#555' }}>
            Skip on this run (reuses existing rows)
          </legend>

          <label
            htmlFor="exclude-images"
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            <input
              type="checkbox"
              id="exclude-images"
              checked={currentSkipModes.has('exclude-images')}
              onChange={e => toggleSkipMode('exclude-images', e)}
            />
            <span>
              <strong>Exclude images</strong> — reuse existing image uploads.
              Speeds up subsequent runs after the initial image batch.
            </span>
          </label>

          <label
            htmlFor="exclude-tags"
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            <input
              type="checkbox"
              id="exclude-tags"
              checked={currentSkipModes.has('exclude-tags')}
              onChange={e => toggleSkipMode('exclude-tags', e)}
            />
            <span>
              <strong>Exclude tags</strong> — reuse existing CMS tags (lookup
              via <code>TagListDocument</code>). Skip the
              <code>createTag</code> / <code>updateTag</code> calls.
            </span>
          </label>

          <label
            htmlFor="exclude-articles"
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              id="exclude-articles"
              checked={currentSkipModes.has('exclude-articles')}
              onChange={e => toggleSkipMode('exclude-articles', e)}
            />
            <span>
              <strong>Exclude articles</strong> — reuse existing articles
              (lookup via <code>ArticleListDocument</code>). Already-published
              articles are not re-published.
            </span>
          </label>
        </fieldset>

        <label
          htmlFor="admin-email"
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <span style={{ minWidth: 140 }}>
            Admin user email
            <br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>
              (subscriptions + invoices get seeded onto this account)
            </span>
          </span>
          <input
            id="admin-email"
            type="email"
            value={adminEmail}
            onChange={e => setAdminEmail(e.currentTarget.value)}
            placeholder="user@example.com"
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #ccc',
              borderRadius: 4,
              fontSize: 14,
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={async e => {
              const self = e.currentTarget;
              self.disabled = true;
              const t = self.innerText;
              self.innerText = 'Seeding…';
              console.log('Starting EE News seeding…');
              try {
                await handleSeed(
                  {
                    uploadImage,
                    createAuthor,
                    createTag,
                    updateTag,
                    createBlockStyle,
                    createArticle,
                    publishArticle,
                    updateArticle,
                    createNavigation,
                    createEvent,
                    createPage,
                    createComment,
                    updateComment,
                    approveComment,
                    publishPage,
                    createMemberPlan,
                    createPaymentMethod,
                    createSubscription,
                    renewSubscription,
                    markInvoiceAsPaid,
                    createCrowdfunding,
                  },
                  client,
                  params,
                  adminEmail.trim()
                );
                console.log('EE News seeding completed.');
              } catch (err) {
                console.error('Seed error:', err);
              }
              self.innerText = t;
              self.disabled = false;
            }}
          >
            Create Content
          </button>
          <button
            onClick={async e => {
              const self = e.currentTarget;
              self.disabled = true;
              const t = self.innerText;
              self.innerText = 'Deleting…';
              try {
                await handleDelete(
                  {
                    deleteTag,
                    deleteAuthor,
                    deleteArticle,
                    deleteNavigation,
                    deletePage,
                    deleteImage,
                    deleteEvent,
                    deleteBlockStyle,
                    deleteComment,
                    deletePaymentMethod,
                    deleteMemberPlan,
                    deleteSubscriptionFlow,
                    deleteSubscription,
                  },
                  client,
                  params
                );
                console.log('EE News deletion completed.');
              } catch (err) {
                console.error('Delete error:', err);
              }
              self.innerText = t;
              self.disabled = false;
            }}
          >
            Delete Content
          </button>
        </div>
      </div>
    </SeedSession>
  );
};
