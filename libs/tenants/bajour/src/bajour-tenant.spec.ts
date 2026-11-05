import { de } from 'date-fns/locale';

import { BajourArticleDateWithShare } from './bajour-article-date-with-share';
import { bajourTenant } from './bajour-tenant';
import { BriefingType } from './components/briefing/is-briefing';
import { BajourBanner } from './components/website-builder-overwrites/banner/bajour-banner';
import { BajourBlockRenderer } from './components/website-builder-overwrites/block-renderer/block-renderer';
import { BajourTeaserSlider } from './components/website-builder-overwrites/blocks/teaser-slider/bajour-teaser-slider';
import { BajourContextBox } from './components/website-builder-overwrites/context-box/context-box';
import theme from './styles/theme';

describe('bajourTenant', () => {
  it('identifies the tenant', () => {
    expect(bajourTenant.id).toBe('bajour');
    expect(bajourTenant.name).toBe('Bajour');
    expect(bajourTenant.builder.meta?.siteTitle).toBe('Bajour');
  });

  it('returns the bajour theme', () => {
    expect(bajourTenant.createTheme()).toBe(theme);
  });

  it('uses the german base translations and date locale', () => {
    expect(bajourTenant.translations).toEqual({ lng: 'de' });
    expect(bajourTenant.dateLocale).toBe(de);
  });

  it('overrides the components bajour passed to the builder', () => {
    expect(bajourTenant.builder.ArticleDate).toBe(BajourArticleDateWithShare);
    expect(bajourTenant.builder.Banner).toBe(BajourBanner);
    expect(bajourTenant.builder.elements?.Link).toBeDefined();
    expect(bajourTenant.builder.blocks?.Renderer).toBe(BajourBlockRenderer);
    expect(Object.keys(bajourTenant.builder.blocks ?? {}).sort()).toEqual([
      'BaseTeaser',
      'Break',
      'Quote',
      'Renderer',
      'TeaserGrid',
      'TeaserList',
      'Title',
    ]);
    expect(bajourTenant.builder.blockStyles).toEqual({
      ContextBox: BajourContextBox,
      TeaserSlider: BajourTeaserSlider,
    });
  });

  it('lists the block styles its renderer understands', () => {
    expect(bajourTenant.blockStyles).toEqual(
      expect.arrayContaining([
        'FrageDesTages',
        'SearchSlider',
        'BestOfWePublish',
        'Archive',
        'Breite Teaser',
        'Kleine Teaser',
        'Light',
        'Sponsored',
        'News',
        ...Object.values(BriefingType),
      ])
    );
    expect(new Set(bajourTenant.blockStyles).size).toBe(
      bajourTenant.blockStyles?.length
    );
  });

  it('does not inject next specific builder props', () => {
    expect(bajourTenant.builder).not.toHaveProperty('Head');
    expect(bajourTenant.builder).not.toHaveProperty('Script');
    expect(bajourTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the bajour way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(bajourTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(bajourTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});
