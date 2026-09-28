import type { Config, Field } from '@measured/puck';
import {
  DEFAULT_FOOTER_LEGAL,
  DEFAULT_GUTTER,
  EMAIL_CSS,
  renderBlock,
  teaserFromArticle,
  theme,
} from '@wepublish/newsletter';
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
import { EMPTY_IMAGE, toBlock } from './convert';
import { imageField } from './image-field';
import { lookupImageUrl } from './images';
import { proseField } from './prose-field';
import { colors } from './styles';

/**
 * The Puck configuration. Every `render` goes through `renderBlock`, the same
 * function that produces the sent mail, so the canvas is the newsletter's own
 * markup rather than an approximation of it.
 */

/** Draws a block as the mail will, with teasers and images filled from the caches. */
function draw(type: string, props: Props, t: TFunction): ReactElement {
  const block = toBlock(type, props);

  if (!block) {
    return (
      <div style={{ padding: 12, color: colors.error }}>
        {t('newsletter.canvas.unknownBlock', { type })}
      </div>
    );
  }

  if (block.type === 'teaser') {
    const article = lookupArticle(block.articleId);

    return (
      <>
        {renderBlock(
          {
            ...block,
            teaser: article ? teaserFromArticle(article) : undefined,
          },
          0
        )}
      </>
    );
  }

  if (block.type === 'image') {
    return (
      <>
        {renderBlock(
          {
            ...block,
            src: block.imageId ? lookupImageUrl(block.imageId) : block.src,
          },
          0
        )}
      </>
    );
  }

  if (block.type === 'panel' && block.image) {
    return (
      <>
        {renderBlock(
          {
            ...block,
            image: {
              ...block.image,
              src:
                block.image.imageId ?
                  lookupImageUrl(block.image.imageId)
                : block.image.src,
            },
          },
          0
        )}
      </>
    );
  }

  return <>{renderBlock(block, 0)}</>;
}

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
            color: colors.muted,
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatDate(article.publishedAt)}
        </span>
        {article.preTitle ?
          <span style={{ color: colors.accent, fontWeight: 600 }}>
            {article.preTitle}
          </span>
        : null}
        <span style={{ fontWeight: 600 }}>{article.title}</span>
      </div>
      <div style={{ color: colors.muted, fontSize: 13 }}>
        {leadExcerpt(article.lead, 180)}
      </div>
    </div>
  );
}

export function createConfig(articles: ArticleChoice[], t: TFunction): Config {
  const prose = proseField(t('newsletter.fields.text'));
  const footerProse = proseField(t('newsletter.fields.footerLines'));
  const legalProse = proseField(t('newsletter.fields.footerLegal'));

  const gutterField: Field = {
    type: 'radio',
    label: t('newsletter.fields.gutter'),
    options: [
      {
        label: t('newsletter.fields.gutterNone', { px: theme.space.noGutter }),
        value: 'none',
      },
      {
        label: t('newsletter.fields.gutterArticle', { px: theme.space.gutter }),
        value: 'article',
      },
      {
        label: t('newsletter.fields.gutterIntro', {
          px: theme.space.introGutter,
        }),
        value: 'intro',
      },
    ],
  };

  // Offered on every block except the footer: a conditional footer would
  // reach part of the audience with no unsubscribe link.
  const conditionSetting = conditionField(t('newsletter.fields.condition'));

  const render = (type: string) => (props: Props) => draw(type, props, t);

  return {
    root: {
      fields: {
        preheader: { type: 'text', label: t('newsletter.fields.preheader') },
      },
      defaultProps: { preheader: '' },
      render: ({ children }: { children: ReactNode }) => (
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
      articles: {
        title: t('newsletter.categories.articles'),
        components: ['teaser', 'rubric', 'divider'],
      },
      content: {
        title: t('newsletter.categories.content'),
        components: ['heading', 'text', 'image', 'panel', 'button'],
      },
      header: {
        title: t('newsletter.categories.header'),
        components: ['meta'],
      },
      footer: {
        title: t('newsletter.categories.footer'),
        components: ['footer'],
        visible: false,
      },
    },

    components: {
      teaser: {
        label: t('newsletter.blocks.teaser'),
        fields: {
          article: {
            type: 'external',
            label: t('newsletter.fields.article'),
            placeholder: t('newsletter.fields.pickArticle'),
            showSearch: true,
            filterFields: {
              tag: {
                type: 'select',
                label: t('newsletter.fields.tag'),
                options: tagOptions(articles, t('newsletter.fields.allTags')),
              },
            },
            get initialFilters() {
              return { tag: rememberedTag(articles) };
            },
            fetchList: async ({ query, filters }) => {
              const tag = (filters?.['tag'] as string | undefined) ?? '';

              rememberTag(tag);

              return searchArticles(articles, query ?? '', tag);
            },
            mapProp: (article: ArticleChoice) => ({
              id: article.id,
              title: article.title,
            }),
            mapRow: (article: ArticleChoice) => ({
              [t('newsletter.fields.article')]: (
                <ArticleRow article={article} />
              ),
            }),
            getItemSummary: (article: { title?: string }) =>
              article?.title ?? t('newsletter.fields.pickArticle'),
            renderFooter: ({ items }) => (
              <span>
                {t('newsletter.fields.articleCount', {
                  shown: items.length,
                  total: articles.length,
                })}
              </span>
            ),
          },
          variant: {
            type: 'radio',
            label: t('newsletter.fields.variant'),
            options: [
              { label: t('newsletter.fields.variantBig'), value: 'big' },
              { label: t('newsletter.fields.variantShort'), value: 'short' },
            ],
          },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          variant: 'short',
          gutter: DEFAULT_GUTTER.teaser,
          condition: NO_CONDITION,
        },
        render: render('teaser'),
      },

      rubric: {
        label: t('newsletter.blocks.rubric'),
        fields: {
          name: { type: 'text', label: t('newsletter.fields.rubric') },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          name: '',
          gutter: DEFAULT_GUTTER.rubric,
          condition: NO_CONDITION,
        },
        render: render('rubric'),
      },

      heading: {
        label: t('newsletter.blocks.heading'),
        fields: {
          text: { type: 'text', label: t('newsletter.fields.heading') },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          text: '',
          gutter: DEFAULT_GUTTER.heading,
          condition: NO_CONDITION,
        },
        render: render('heading'),
      },

      text: {
        label: t('newsletter.blocks.text'),
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
        render: render('text'),
      },

      image: {
        label: t('newsletter.blocks.image'),
        fields: {
          image: imageField(t('newsletter.fields.image')),
          alt: { type: 'text', label: t('newsletter.fields.alt') },
          href: { type: 'text', label: t('newsletter.fields.imageHref') },
          caption: { type: 'text', label: t('newsletter.fields.caption') },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          image: EMPTY_IMAGE,
          alt: '',
          href: '',
          caption: '',
          gutter: DEFAULT_GUTTER.image,
          condition: NO_CONDITION,
        },
        render: render('image'),
      },

      panel: {
        label: t('newsletter.blocks.panel'),
        fields: {
          title: { type: 'text', label: t('newsletter.fields.title') },
          body: prose,
          image: imageField(t('newsletter.fields.panelImage')),
          linkLabel: { type: 'text', label: t('newsletter.fields.linkLabel') },
          linkHref: { type: 'text', label: t('newsletter.fields.linkHref') },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          title: '',
          body: '',
          image: EMPTY_IMAGE,
          linkLabel: '',
          linkHref: '',
          gutter: DEFAULT_GUTTER.panel,
          condition: NO_CONDITION,
        },
        render: render('panel'),
      },

      button: {
        label: t('newsletter.blocks.button'),
        fields: {
          label: { type: 'text', label: t('newsletter.fields.buttonLabel') },
          href: { type: 'text', label: t('newsletter.fields.buttonHref') },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          label: '',
          href: 'https://',
          gutter: DEFAULT_GUTTER.button,
          condition: NO_CONDITION,
        },
        render: render('button'),
      },

      meta: {
        label: t('newsletter.blocks.meta'),
        fields: {
          left: { type: 'text', label: t('newsletter.fields.metaLeft') },
          right: { type: 'text', label: t('newsletter.fields.metaRight') },
          gutter: gutterField,
          condition: conditionSetting,
        },
        defaultProps: {
          left: 'Newsletter',
          right: '',
          gutter: DEFAULT_GUTTER.meta,
          condition: NO_CONDITION,
        },
        render: render('meta'),
      },

      divider: {
        label: t('newsletter.blocks.divider'),
        fields: { gutter: gutterField, condition: conditionSetting },
        defaultProps: {
          gutter: DEFAULT_GUTTER.divider,
          condition: NO_CONDITION,
        },
        render: render('divider'),
      },

      // Pinned: every permission that could lose the footer is denied, and
      // `toPuckData` puts exactly one in every document.
      footer: {
        label: t('newsletter.blocks.footer'),
        permissions: {
          drag: false,
          duplicate: false,
          delete: false,
          insert: false,
        },
        fields: {
          title: { type: 'text', label: t('newsletter.fields.footerTitle') },
          lines: footerProse,
          legal: legalProse,
          gutter: gutterField,
        },
        defaultProps: {
          title: '',
          lines: '',
          legal: DEFAULT_FOOTER_LEGAL.join('\n'),
          gutter: DEFAULT_GUTTER.footer,
        },
        render: render('footer'),
      },
    },
  };
}
