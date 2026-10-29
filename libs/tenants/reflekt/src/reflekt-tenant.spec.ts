import { de } from 'date-fns/locale';

import { ReflektBlockStyles } from './components/block-styles/reflekt-block-styles';
import { ReflektNavbar } from './components/reflekt-navbar';
import deOverridden from './locales/deOverridden.json';
import { reflektTenant } from './reflekt-tenant';
import theme from './theme';

describe('reflektTenant', () => {
  it('identifies the tenant', () => {
    expect(reflektTenant.id).toBe('reflekt');
    expect(reflektTenant.builder.meta?.siteTitle).toBe('Reflekt');
  });

  it('returns the reflekt theme', () => {
    expect(reflektTenant.createTheme()).toBe(theme);
  });

  it('carries the german translation overrides and date locale', () => {
    expect(reflektTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverridden },
    });
    expect(reflektTenant.dateLocale).toBe(de);
  });

  it('overrides the navbar, the block renderer and the elements', () => {
    expect(reflektTenant.builder.Navbar).toBe(ReflektNavbar);
    expect(reflektTenant.builder.blocks?.Renderer).toBeDefined();
    expect(reflektTenant.builder.blocks?.Crowdfunding).toBeDefined();
    expect(reflektTenant.builder.blockStyles?.ImageSlider).toBeDefined();
    expect(reflektTenant.builder.elements?.Modal).toBeDefined();
    expect(reflektTenant.builder.richtext?.RenderLeaf).toBeDefined();
    expect(reflektTenant.builder.LoginForm).toBeDefined();
  });

  it('lists the block styles its renderer understands', () => {
    expect(reflektTenant.blockStyles).toEqual(
      Object.values(ReflektBlockStyles)
    );
  });

  it('does not inject next specific builder props', () => {
    expect(reflektTenant.builder).not.toHaveProperty('Head');
    expect(reflektTenant.builder).not.toHaveProperty('Script');
    expect(reflektTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the reflekt way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(reflektTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(reflektTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});
