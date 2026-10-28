import { applyTranslationOverrides } from '@wepublish/utils/website/i18n';
import { WebsiteTenantConfig } from '@wepublish/website/builder';
import { setDefaultOptions } from 'date-fns';
import { de, fr } from 'date-fns/locale';
import i18next from 'i18next';

export type TestLocale = 'de' | 'fr';

const dateLocales = { de, fr };

export const setTestLocale = (locale: TestLocale) => {
  if (i18next.language !== locale) {
    i18next.changeLanguage(locale);
  }

  setDefaultOptions({ locale: dateLocales[locale] });
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
};

export const applyTenantTranslations = async (tenant: WebsiteTenantConfig) => {
  await applyTranslationOverrides(i18next, tenant.translations.overrides ?? {});
  setTestLocale(tenant.translations.lng);
  setDefaultOptions({ locale: tenant.dateLocale });
};

export const resetTranslations = async () => {
  await applyTranslationOverrides(i18next, {});
  setTestLocale('de');
};
