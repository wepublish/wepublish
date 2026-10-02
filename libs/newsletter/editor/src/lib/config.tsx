/**
 * The Puck configuration: which blocks the editor offers and how each is drawn.
 *
 * Every `render` goes through `renderBlock` — the *same* function that produces
 * the sent email, `@react-email/components` and all: the canvas is not an
 * approximation of the newsletter, it is the newsletter's own markup, styled by
 * the newsletter's own stylesheet. `blocks.tsx` therefore has to stay free of
 * anything that only works on the server — the components themselves are plain
 * React and render in the browser unchanged.
 *
 * Built by a function rather than exported as a constant because the article
 * picker's tag dropdown is populated from the articles themselves, which are not
 * known until they have been fetched — and because every label is translated.
 */
import type { Config, Field } from '@puckeditor/core';
import {
  DEFAULT_FOOTER_LEGAL,
  DEFAULT_GUTTER,
  EMAIL_CSS,
  NewsletterBlock,
  renderBlock,
  teaserFromArticle,
  theme,
} from '@wepublish/newsletter/email';
import type { TFunction } from 'i18next';
import type { ReactElement, ReactNode } from 'react';
import type { ArticleChoice } from './articles';
import {
  formatDate,
  leadExcerpt,
  lookupArticle,
  rememberedTag,
  rememberTag,
  searchArticles,
  tagOptions,
} from './articles';
import { conditionField, NO_CONDITION } from './condition-field';
import type { Props } from './convert';
import { toBlock } from './convert';
import { lookupImage } from './images';
import { mediaField } from './media-field';
import { proseField } from './prose-field';

interface RootRenderProps {
  children: ReactNode;
}

/**
 * Draws a block exactly as the email will, from the props Puck is holding.
 *
 * Puck requires an element back, so an unconvertible block gets a visible
 * placeholder rather than `null` — an empty canvas slot looks like a rendering
 * bug, and a block that silently disappears is worse than one that complains.
 */
/**
 * Teasers are filled from the cached article list using the same function the
 * server uses, and images from the image cache, so the canvas and the sent mail
 * agree on what is shown.
 */
function resolve(block: NewsletterBlock): NewsletterBlock {
  switch (block.type) {
    case 'teaser': {
      const article = lookupArticle(block.articleId);

      return {
        ...block,
        teaser: article ? teaserFromArticle(article) : undefined,
      };
    }
    case 'image':
      return { ...block, src: lookupImage(block.imageId)?.url };
    case 'panel':
      return { ...block, imageUrl: lookupImage(block.imageId)?.url };
    default:
      return block;
  }
}

function draw(t: TFunction, type: string, props: Props): ReactElement {
  const block = toBlock(type, props);

  if (!block) {
    return (
      <div style={{ padding: 12, color: '#a11' }}>
        {t('newsletter.editor.unknownBlock', { type })}
      </div>
    );
  }

  const drawable = resolve(block);

  // The mail leaves an image block without an image out entirely, which in
  // the canvas would be a block nobody can click on to pick one.
  if (drawable.type === 'image' && !drawable.src) {
    return (
      <div
        style={{
          margin: `${theme.space.block} ${theme.space.gutter}`,
          padding: theme.space.section,
          border: `1px dashed ${theme.color.rule}`,
          color: theme.color.brand,
          fontFamily: theme.font.body,
          textAlign: 'center',
        }}
      >
        {t('newsletter.editor.pickImage', { alt: drawable.alt })}
      </div>
    );
  }

  return <>{renderBlock(drawable, 0)}</>;
}

/**
 * One row of the article picker: date, source and title on the first line, the
 * lead underneath.
 *
 * The date is `nowrap` with tabular figures so the dates line up down the column
 * and never break across two lines, while the title — the part that varies most
 * in length — is free to wrap and take the space it needs.
 */
function ArticleRow({ article }: { article: ArticleChoice }) {
  return (
    <div style={{ display: 'grid', gap: 2, lineHeight: 1.35, minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0 8px',
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            color: '#5c6870',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatDate(article.publishedAt)}
        </span>
        {article.preTitle ?
          <span style={{ color: '#195a7d', fontWeight: 600 }}>
            {article.preTitle}
          </span>
        : null}
        <span style={{ fontWeight: 600 }}>{article.title}</span>
      </div>
      <div style={{ color: '#5c6870', fontSize: 13 }}>
        {leadExcerpt(article.lead, 180)}
      </div>
    </div>
  );
}

export function createConfig(articles: ArticleChoice[], t: TFunction): Config {
  const prose = proseField(t('newsletter.blocks.text.body'));

  /** The footer's own two prose fields; both offer the merge-tag picker. */
  const footerProse = proseField(t('newsletter.blocks.footer.lines'));
  const legalProse = proseField(t('newsletter.blocks.footer.legal'));

  /**
   * The same `Einzug` on every block, so a column of blocks lines up by default
   * and an editor sets the inset the same way wherever they are.
   *
   * The labels name the pixels because that is what an editor comparing a draft
   * against a sent issue is actually looking for; the values are what the document
   * stores. `theme.space` is where the three measurements are defined.
   */
  const gutterField: Field = {
    type: 'radio',
    label: t('newsletter.blocks.gutter.label'),
    options: [
      {
        label: t('newsletter.blocks.gutter.none', {
          size: theme.space.noGutter,
        }),
        value: 'none',
      },
      {
        label: t('newsletter.blocks.gutter.article', {
          size: theme.space.gutter,
        }),
        value: 'article',
      },
      {
        label: t('newsletter.blocks.gutter.intro', {
          size: theme.space.introGutter,
        }),
        value: 'intro',
      },
    ],
  };

  /**
   * Mailchimp's dynamic content, offered on every block *except* the footer.
   *
   * One shared field like `gutterField`, and the last one in every block's list:
   * it decides who sees the block rather than what the block says, so it reads as
   * a setting on the finished block rather than as part of writing it.
   *
   * The footer is left out on purpose. It is not that the tags would fail there —
   * they would work — but that `missingRequiredFooterTags` checks the *rendered
   * HTML*, where `*|UNSUB|*` sits inside the condition and counts as present. An
   * issue whose closing block was conditional would publish cleanly and reach
   * part of the audience with no way to unsubscribe. `parseDocument` refuses one
   * that arrives from anywhere else.
   */
  const conditionSetting = conditionField(t('newsletter.blocks.condition'));

  return {
    root: {
      // No fields: the preview text is edited in the «Einstellungen» tab, with
      // the title, rather than in a panel that only appears with nothing selected.
      // Empty rather than absent — absent, Puck shows a `title` field of its own.
      fields: {},
      defaultProps: {
        preheader: '',
      },
      // No footer here any more: it is the `footer` block below, which
      // `toPuckData` guarantees every document has. Drawing it here as well is
      // what would give the canvas two closing blocks.
      render: ({ children }: RootRenderProps) => (
        <>
          <style dangerouslySetInnerHTML={{ __html: EMAIL_CSS }} />
          <div
            style={{
              width: theme.contentWidth,
              maxWidth: '100%',
              margin: '0 auto',
              background: theme.color.body,
              fontFamily: theme.font.body,
            }}
          >
            {children}
          </div>
        </>
      ),
    },

    categories: {
      Artikel: {
        title: t('newsletter.categories.articles'),
        components: ['teaser', 'rubric', 'divider'],
      },
      Inhalt: {
        title: t('newsletter.categories.content'),
        components: ['heading', 'text', 'image', 'panel', 'button'],
      },
      Kopfzeile: {
        title: t('newsletter.categories.header'),
        components: ['meta'],
      },
      // Hidden rather than listed: every issue already has exactly one footer
      // and there is nothing to drag in. `permissions.insert` below refuses the
      // drag as well, so a future category change cannot let a second one in.
      Fusszeile: {
        title: t('newsletter.categories.footer'),
        components: ['footer'],
        visible: false,
      },
    },

    components: {
      teaser: {
        label: t('newsletter.blocks.teaser.label'),
        fields: {
          article: {
            type: 'external',
            label: t('newsletter.blocks.teaser.article'),
            placeholder: t('newsletter.blocks.teaser.pick'),
            showSearch: true,
            filterFields: {
              tag: {
                type: 'select',
                label: t('newsletter.blocks.teaser.tag'),
                options: tagOptions(
                  articles,
                  t('newsletter.blocks.teaser.allTags')
                ),
              },
            },
            // A getter, not a value: the config is built once per session but
            // Puck reads `initialFilters` every time the picker mounts, so this
            // is what lets a tag chosen for one teaser greet the next one.
            get initialFilters() {
              return { tag: rememberedTag(articles) };
            },
            // The list is already sorted newest-first by `loadArticles`, and
            // filtering preserves that order. Remembering the tag here rides on
            // Puck's own result cache, which skips this call when the same block
            // is filtered by a tag it has already shown — so switching back and
            // forth within one teaser can leave the memory a step behind. It only
            // seeds the next picker, so that costs a dropdown pick, nothing more.
            fetchList: async ({ query, filters }) => {
              const tag = (filters?.tag as string | undefined) ?? '';

              rememberTag(tag);

              return searchArticles(articles, query ?? '', tag);
            },
            // Only the id is kept; the title rides along so the chip and the
            // canvas have something to show before the CMS is consulted.
            mapProp: (article: ArticleChoice) => ({
              id: article.id,
              title: article.title,
            }),
            // One column, not four: the row is a two-line card rather than a
            // table of fields, so a long title wraps into its own line instead
            // of squeezing the lead column down to a few words.
            mapRow: (article: ArticleChoice) => ({
              [t('newsletter.blocks.teaser.article')]: (
                <ArticleRow article={article} />
              ),
            }),
            getItemSummary: (article: { title?: string }) =>
              article?.title ?? t('newsletter.blocks.teaser.pick'),
            // The unfiltered list runs to several hundred rows, so say how many
            // the current tag and search actually match.
            renderFooter: ({ items }) => (
              <span>
                {t('newsletter.blocks.teaser.count', {
                  count: items.length,
                  total: articles.length,
                })}
              </span>
            ),
          },
          variant: {
            type: 'radio',
            label: t('newsletter.blocks.teaser.variant'),
            options: [
              { label: t('newsletter.blocks.teaser.big'), value: 'big' },
              { label: t('newsletter.blocks.teaser.short'), value: 'short' },
            ],
          },
          // No text fields on purpose. Headline, kicker, lead, link and image
          // belong to the article; editing them here would create a second copy
          // that silently disagrees with the website. Corrections go in the CMS.
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          variant: 'short',
          gutter: DEFAULT_GUTTER.teaser,
          condition: NO_CONDITION,
        },
        render: props => draw(t, 'teaser', props as Props),
      },

      rubric: {
        label: t('newsletter.blocks.rubric.label'),
        fields: {
          name: { type: 'text', label: t('newsletter.blocks.rubric.name') },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          name: 'Solar',
          gutter: DEFAULT_GUTTER.rubric,
          condition: NO_CONDITION,
        },
        render: props => draw(t, 'rubric', props as Props),
      },

      heading: {
        label: t('newsletter.blocks.heading.label'),
        fields: {
          text: { type: 'text', label: t('newsletter.blocks.heading.text') },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          text: 'Titel der Ausgabe',
          gutter: DEFAULT_GUTTER.heading,
          condition: NO_CONDITION,
        },
        render: props => draw(t, 'heading', props as Props),
      },

      text: {
        label: t('newsletter.blocks.text.label'),
        fields: {
          body: prose,
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          body: '',
          gutter: DEFAULT_GUTTER.text,
          condition: NO_CONDITION,
        },
        render: props => draw(t, 'text', props as Props),
      },

      image: {
        label: t('newsletter.blocks.image.label'),
        fields: {
          imageId: mediaField(t('newsletter.blocks.image.image')),
          alt: { type: 'text', label: t('newsletter.blocks.image.alt') },
          href: { type: 'text', label: t('newsletter.blocks.image.href') },
          caption: {
            type: 'text',
            label: t('newsletter.blocks.image.caption'),
          },
          // No width and no border: an image spans the column its Einzug leaves,
          // so it lines up with the text above and below it by construction.
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          imageId: '',
          alt: '',
          href: '',
          caption: '',
          gutter: DEFAULT_GUTTER.image,
          condition: NO_CONDITION,
        },
        render: props => draw(t, 'image', props as Props),
      },

      panel: {
        label: t('newsletter.blocks.panel.label'),
        fields: {
          title: { type: 'text', label: t('newsletter.blocks.panel.title') },
          body: prose,
          imageId: mediaField(t('newsletter.blocks.panel.image')),
          linkLabel: {
            type: 'text',
            label: t('newsletter.blocks.panel.linkLabel'),
          },
          linkHref: {
            type: 'text',
            label: t('newsletter.blocks.panel.linkHref'),
          },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          title: 'Gewusst?',
          body: '',
          imageId: '',
          linkLabel: '',
          linkHref: '',
          gutter: DEFAULT_GUTTER.panel,
          condition: NO_CONDITION,
        },
        render: props => draw(t, 'panel', props as Props),
      },

      button: {
        label: t('newsletter.blocks.button.label'),
        fields: {
          label: { type: 'text', label: t('newsletter.blocks.button.text') },
          href: { type: 'text', label: t('newsletter.blocks.button.href') },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          label: 'Jetzt unterstützen',
          href: 'https://www.ee-news.ch/',
          gutter: DEFAULT_GUTTER.button,
          condition: NO_CONDITION,
        },
        render: props => draw(t, 'button', props as Props),
      },

      meta: {
        label: t('newsletter.blocks.meta.label'),
        fields: {
          left: { type: 'text', label: t('newsletter.blocks.meta.left') },
          right: { type: 'text', label: t('newsletter.blocks.meta.right') },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          left: 'Newsletter',
          right: '',
          gutter: DEFAULT_GUTTER.meta,
          condition: NO_CONDITION,
        },
        render: props => draw(t, 'meta', props as Props),
      },

      divider: {
        label: t('newsletter.blocks.divider.label'),
        fields: { gutter: gutterField, condition: conditionSetting },
        defaultProps: {
          gutter: DEFAULT_GUTTER.divider,
          condition: NO_CONDITION,
        },
        render: props => draw(t, 'divider', props as Props),
      },

      /**
       * The closing block, pinned.
       *
       * A block, so an editor can click it in the canvas and edit it like any
       * other — but not optional, so every permission that could lose it is
       * denied: no drag, no duplicate, no delete, no insert (the drawer entry is
       * hidden too), and `toPuckData` puts exactly one in every document.
       *
       * `Rechtliches` starts from `DEFAULT_FOOTER_LEGAL`, so an editor who never
       * touches it sends the same notice as last week, and one who does still has
       * the publish check refusing an issue that lost `*|UNSUB|*` or the address.
       */
      footer: {
        label: t('newsletter.blocks.footer.label'),
        permissions: {
          drag: false,
          duplicate: false,
          delete: false,
          insert: false,
        },
        fields: {
          title: { type: 'text', label: t('newsletter.blocks.footer.title') },
          lines: footerProse,
          legal: legalProse,
          gutter: gutterField,
        },
        defaultProps: {
          title: 'ee-news.ch',
          lines: '',
          legal: DEFAULT_FOOTER_LEGAL.join('\n'),
          gutter: DEFAULT_GUTTER.footer,
        },
        render: props => draw(t, 'footer', props as Props),
      },
    },
  };
}
