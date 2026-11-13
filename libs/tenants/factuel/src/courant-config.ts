import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { CourantArticleAuthors } from './components/courant-article-authors';
import { CourantArticleList } from './components/courant-article-list';
import { CourantAuthorChip } from './components/courant-author-chip';
import { CourantBlocks } from './components/courant-blocks';
import { CourantBreakBlock } from './components/courant-break-block';
import { CourantCommentList } from './components/courant-comment-list';
import { CourantContentWrapper } from './components/courant-content-wrapper';
import { CourantFooter } from './components/courant-footer';
import { CourantGlobalStyles } from './components/courant-global-styles';
import { CourantNavbar } from './components/courant-navbar';
import { CourantRichTextBlock } from './components/courant-richtext-block';
import { CourantSubscribeBlock } from './components/courant-subscribe-block';
import { CourantTeaser } from './components/courant-teaser';
import { CourantTitleBlock } from './components/courant-title-block';
import frOverridden from './locales/frOverridden.json';
import { createCourantTheme } from './theme';

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ?
    `${format(date, 'dd. MMMM yyyy', { locale: fr })} à ${format(date, 'HH:mm', { locale: fr })}`
  : format(date, 'dd. MMMM yyyy', { locale: fr });

/**
 * Framework-neutral tenant config: no `next/link` so the TanStack Start app
 * can consume it without pulling Next into the bundle. The router-specific
 * link is wired by the app via `extra.elements.Link`.
 */
export const courantConfig: WebsiteTenantConfig = {
  id: 'factuel',
  name: 'Courant',
  createTheme: createCourantTheme,
  builder: {
    ContentWrapper: CourantContentWrapper,
    Navbar: CourantNavbar,
    Footer: CourantFooter,
    ArticleAuthors: CourantArticleAuthors,
    ArticleList: CourantArticleList,
    AuthorChip: CourantAuthorChip,
    CommentList: CourantCommentList,
    blocks: {
      BaseTeaser: CourantTeaser,
      Blocks: CourantBlocks,
      Break: CourantBreakBlock,
      RichText: CourantRichTextBlock,
      Subscribe: CourantSubscribeBlock,
      Title: CourantTitleBlock,
    },
    date: { format: dateFormatter },
    meta: { siteTitle: 'Courant', locale: 'fr-CH' },
  },
  blockStyles: ['TeamMember'],
  translations: {
    lng: 'fr',
    overrides: { fr: frOverridden },
  },
  dateLocale: fr,
  GlobalStyles: CourantGlobalStyles,
};
