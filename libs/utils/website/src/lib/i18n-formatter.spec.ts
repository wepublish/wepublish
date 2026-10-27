/* eslint-disable import/first */
vi.mock('@wepublish/website/translations/de.json', () => ({
  default: {
    lang: 'Deutsch',
    paymentMethod: 'Zahlungsmethode: {paymentMethod}',
    cancel: '{type, select, Donation {Spende} other {Abo}} kündigen',
    zod: {
      required: 'Erforderlich',
    },
  },
}));

vi.mock('@wepublish/website/translations/fr.json', () => ({
  default: {
    lang: 'Français',
    zod: {
      required: 'Requis',
    },
  },
}));

import { i18n } from 'i18next';
import { initWePublishTranslator } from './i18n-formatter';

describe('initWePublishTranslator', () => {
  let i18n: i18n;
  beforeEach(() => {
    i18n = initWePublishTranslator();
    console.log(i18n.services.resourceStore.data);
  });

  it('should initialize i18next', () => {
    expect(i18n).toBeDefined();
    expect(i18n.t('zod')).toBeDefined();
  });
  it('should default to German translations', () => {
    expect(i18n.language).toBe('de');
    expect(i18n.t('lang')).toBe('Deutsch');
  });
  // the server renders with the package Node loads, not the bundler's build
  it('formats ICU arguments and selects', () => {
    expect(i18n.t('paymentMethod', { paymentMethod: 'bexio' })).toBe(
      'Zahlungsmethode: bexio'
    );
    expect(i18n.t('cancel', { type: 'Subscription' })).toBe('Abo kündigen');
  });

  it('should be able to switch to French', () => {
    i18n.changeLanguage('fr');
    expect(i18n.language).toBe('fr');
    expect(i18n.t('lang')).toBe('Français');
  });
  it('should fallback to German if an unsupported language is selected', () => {
    i18n.changeLanguage('es');
    expect(i18n.t('lang')).toBe('Deutsch');
  });

  it('should allow overriding translations', () => {
    const required = 'REQ';
    const i18nextInstance = initWePublishTranslator({
      zod: {
        required,
      },
    });
    expect(i18nextInstance.t('zod.required')).toBe(required);
  });
  it('should allow overriding translations for all languages', () => {
    const required = 'REQ';
    const i18nextInstance = initWePublishTranslator({
      zod: {
        required,
      },
    });
    i18nextInstance.changeLanguage('fr');
    expect(i18nextInstance.t('zod.required')).toBe(required);
  });
});
