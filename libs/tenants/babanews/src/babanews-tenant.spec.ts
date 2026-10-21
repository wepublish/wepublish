import { NextWepublishLink } from '@wepublish/utils/website/link';
import { de } from 'date-fns/locale';

import { babanewsTenant } from './babanews-tenant';
import { BabanewsBlockRenderer } from './components/website-builder-overwrites/block-renderer/block-renderer';
import { BabanewsBanner } from './components/website-builder-overwrites/blocks/banner';
import { BabanewsTeaserGrid } from './components/website-builder-styled/blocks/teaser-grid-styled';
import theme from './theme';

describe('babanewsTenant', () => {
  it('identifies the tenant', () => {
    expect(babanewsTenant.id).toBe('babanews');
    expect(babanewsTenant.name).toBe('baba news');
    expect(babanewsTenant.builder.meta?.siteTitle).toBe('baba news');
  });

  it('returns the babanews theme', () => {
    expect(babanewsTenant.createTheme()).toBe(theme);
  });

  it('uses german without translation overrides', () => {
    expect(babanewsTenant.translations).toEqual({ lng: 'de' });
    expect(babanewsTenant.dateLocale).toBe(de);
  });

  it('overrides the link, the block renderer, the teaser grid and the banner', () => {
    expect(babanewsTenant.builder.elements?.Link).toBe(NextWepublishLink);
    expect(babanewsTenant.builder.blocks?.Renderer).toBe(BabanewsBlockRenderer);
    expect(babanewsTenant.builder.blocks?.TeaserGrid).toBe(BabanewsTeaserGrid);
    expect(babanewsTenant.builder.blockStyles?.Banner).toBe(BabanewsBanner);
  });

  it('lists the block styles its renderer understands', () => {
    expect(babanewsTenant.blockStyles).toEqual(['Instagram']);
  });

  it('does not inject next specific builder props', () => {
    expect(babanewsTenant.builder).not.toHaveProperty('Head');
    expect(babanewsTenant.builder).not.toHaveProperty('Script');
    expect(babanewsTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the babanews way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(babanewsTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(babanewsTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});
