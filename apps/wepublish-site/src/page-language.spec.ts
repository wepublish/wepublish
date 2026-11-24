import { wepublishSiteTenant } from '@wepublish/tenant/wepublish-site';
import i18next from 'i18next';

import { setUpTranslations, syncPageLanguage } from './page-language';

describe('page language', () => {
  beforeAll(() =>
    setUpTranslations(wepublishSiteTenant.translations.overrides ?? {})
  );

  it('shows the texts of the site in French on a French page', () => {
    syncPageLanguage(i18next, 'fr');

    expect(i18next.t('article.share')).toBe('Partager');
    expect(i18next.t('eventOverview.title')).toBe('Événements');
  });

  it('shows the texts of the site in German on a German page', () => {
    syncPageLanguage(i18next, 'fr');
    syncPageLanguage(i18next, 'de');

    expect(i18next.t('article.share')).toBe('Teilen');
  });

  it('falls back to German without a language in the address', () => {
    syncPageLanguage(i18next, 'fr');
    syncPageLanguage(i18next, 'default');

    expect(i18next.language).toBe('de');
  });
});
