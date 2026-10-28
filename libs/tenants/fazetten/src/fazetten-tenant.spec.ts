import { NextWepublishLink } from '@wepublish/utils/website/link';
import { FullBlockFragment } from '@wepublish/website/api';
import { de } from 'date-fns/locale';

import { FazettenBlockStyles } from './components/block-styles/fazetten-block-styles';
import { FazettenArticle } from './components/fazetten-article';
import { FazettenTitleBlock } from './components/fazetten-title-block';
import { isExtraSpacingTitleBlock } from './components/is-extra-spacing';
import { FazettenBaseTeaserSlots } from './components/teaser-layouts/fazetten-base-teaser-slots';
import { FazettenAlternatingTeaser } from './components/teasers/fazetten-alternating-teaser';
import { FazettenBaseTeaser } from './components/teasers/fazetten-base-teaser';
import { fazettenTenant } from './fazetten-tenant';
import deOverriden from './locales/deOverriden.json';
import theme, { FazettenGlobalStyles } from './theme';

describe('fazettenTenant', () => {
  it('identifies the tenant', () => {
    expect(fazettenTenant.id).toBe('fazetten');
    expect(fazettenTenant.builder.meta?.siteTitle).toBe('Fazetten');
  });

  it('returns the fazetten theme regardless of the settings theme', () => {
    expect(fazettenTenant.createTheme()).toBe(theme);
    expect(
      fazettenTenant.createTheme({ palette: { primary: { main: '#000' } } })
    ).toBe(theme);
  });

  it('carries the german translation overrides and date locale', () => {
    expect(fazettenTenant.translations).toEqual({
      lng: 'de',
      overrides: { de: deOverriden },
    });
    expect(fazettenTenant.dateLocale).toBe(de);
  });

  it('passes the same builder props the app did', () => {
    expect(fazettenTenant.builder.Article).toBe(FazettenArticle);
    expect(fazettenTenant.builder.elements?.Link).toBe(NextWepublishLink);
    expect(fazettenTenant.builder.blocks).toEqual({
      Title: FazettenTitleBlock,
      TeaserSlots: FazettenBaseTeaserSlots,
      BaseTeaser: FazettenBaseTeaser,
    });
    expect(fazettenTenant.builder.blockStyles).toEqual({
      AlternatingTeaser: FazettenAlternatingTeaser,
    });
  });

  it('renders the fazetten global styles', () => {
    expect(fazettenTenant.GlobalStyles).toBe(FazettenGlobalStyles);
  });

  it('lists the block styles its components understand', () => {
    expect(fazettenTenant.blockStyles).toEqual(['LogoWall', 'ExtraSpacing']);
    expect(fazettenTenant.blockStyles).toEqual(
      Object.values(FazettenBlockStyles)
    );
  });

  it('gives title blocks with the extra spacing style the extra spacing', () => {
    expect(
      isExtraSpacingTitleBlock({
        __typename: 'TitleBlock',
        blockStyle: FazettenBlockStyles.ExtraSpacing,
      } as FullBlockFragment)
    ).toBe(true);
  });

  it('does not inject next specific builder props', () => {
    expect(fazettenTenant.builder).not.toHaveProperty('Head');
    expect(fazettenTenant.builder).not.toHaveProperty('Script');
    expect(fazettenTenant.builder).not.toHaveProperty('thirdParty');
  });

  it('formats dates the fazetten way', () => {
    const date = new Date(2024, 0, 5, 9, 7);

    expect(fazettenTenant.builder.date?.format?.(date)).toBe(
      '05. Januar 2024 um 09:07'
    );
    expect(fazettenTenant.builder.date?.format?.(date, false)).toBe(
      '05. Januar 2024'
    );
  });
});
