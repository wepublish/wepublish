import { de } from 'date-fns/locale';

import { MannschaftArticle } from './mannschaft-article';
import { MannschaftArticleDateWithShare } from './mannschaft-article-date-with-share';
import { MannschaftBlockRenderer } from './mannschaft-block-renderer';
import { MannschaftBlocks } from './mannschaft-blocks';
import { MannschaftBreakBlock } from './mannschaft-break-block';
import { MannschaftFocusTeaser } from './mannschaft-focus-teaser';
import { MannschaftGlobalStyles } from './mannschaft-global-styles';
import { MannschaftPage } from './mannschaft-page';
import { MannschaftRichtextBlock } from './mannschaft-richtext-block';
import { MannschaftTeaser } from './mannschaft-teaser';
import { MannschaftTeaserGrid } from './mannschaft-teaser-grid';
import { mannschaftTenant } from './mannschaft-tenant';
import theme from './theme';

describe('mannschaftTenant', () => {
  it('identifies the tenant', () => {
    expect(mannschaftTenant.id).toBe('mannschaft');
    expect(mannschaftTenant.name).toBe('Mannschaft');
    expect(mannschaftTenant.builder.meta?.siteTitle).toBe('Mannschaft');
  });

  it('returns the mannschaft theme', () => {
    expect(mannschaftTenant.createTheme()).toBe(theme);
  });

  it('is german without translation overrides', () => {
    expect(mannschaftTenant.translations).toEqual({ lng: 'de' });
    expect(mannschaftTenant.dateLocale).toBe(de);
  });

  it('passes the components the app used to pass', () => {
    expect(mannschaftTenant.builder.Page).toBe(MannschaftPage);
    expect(mannschaftTenant.builder.Article).toBe(MannschaftArticle);
    expect(mannschaftTenant.builder.ArticleDate).toBe(
      MannschaftArticleDateWithShare
    );
    expect(mannschaftTenant.builder.blocks).toEqual({
      Blocks: MannschaftBlocks,
      Renderer: MannschaftBlockRenderer,
      BaseTeaser: MannschaftTeaser,
      TeaserGrid: MannschaftTeaserGrid,
      Break: MannschaftBreakBlock,
      RichText: MannschaftRichtextBlock,
    });
    expect(mannschaftTenant.builder.blockStyles).toEqual({
      FocusTeaser: MannschaftFocusTeaser,
    });
    expect(mannschaftTenant.builder.elements?.Link).toBeDefined();
    expect(mannschaftTenant.GlobalStyles).toBe(MannschaftGlobalStyles);
    expect(mannschaftTenant.Wrapper).toBeUndefined();
  });

  it('does not inject next specific builder props', () => {
    expect(mannschaftTenant.builder).not.toHaveProperty('Head');
    expect(mannschaftTenant.builder).not.toHaveProperty('Script');
    expect(mannschaftTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('lists the block styles its renderer understands', () => {
    expect(mannschaftTenant.blockStyles).toEqual(
      expect.arrayContaining([
        'Primary Bg',
        'Schwarz Bg',
        'Secondary Bg',
        'Pink Bg',
        'Accent Bg',
        'Türkis Bg',
        'Light Accent Bg',
        'Gelb Bg',
        'Violett Bg',
        'Lila Bg',
        'Warning Bg',
        'Orange Bg',
        'Error Bg',
        'Rot Bg',
        'Success Bg',
        'Grün Bg',
        'Info Bg',
        'Blau Bg',
        'ContentBox',
        '1st Teaser Ad',
        '2nd Teaser Ad',
        '3rd Teaser Ad',
        'Highlight',
        'Hot & Trending',
        'Focus',
        'Slider',
      ])
    );
    expect(new Set(mannschaftTenant.blockStyles).size).toBe(
      mannschaftTenant.blockStyles?.length
    );
  });

  it('formats dates the mannschaft way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(mannschaftTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(mannschaftTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});
