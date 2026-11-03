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

const { captureMessage } = vi.hoisted(() => ({ captureMessage: vi.fn() }));

vi.mock('@sentry/core', () => ({ captureMessage }));

import type { i18n } from 'i18next';
import type * as I18nFormatter from './i18n-formatter';

let initWePublishTranslator: typeof I18nFormatter.initWePublishTranslator;
let applyTranslationOverrides: typeof I18nFormatter.applyTranslationOverrides;

beforeAll(async () => {
  vi.resetModules();
  ({ initWePublishTranslator, applyTranslationOverrides } =
    await import('./i18n-formatter'));
});

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

describe('missing translations', () => {
  let i18n: i18n;
  beforeEach(async () => {
    captureMessage.mockClear();
    i18n = initWePublishTranslator();
    await i18n.changeLanguage('de');
  });

  it('should report a missing key to Sentry', async () => {
    i18n.t('doesNotExist');

    await vi.waitFor(() =>
      expect(captureMessage).toHaveBeenCalledWith(
        'Missing translation "doesNotExist"',
        {
          level: 'error',
          tags: { 'i18n.language': 'de', 'i18n.namespace': 'translation' },
          extra: { key: 'doesNotExist' },
        }
      )
    );
  });

  it('should report the language that was rendered', async () => {
    await i18n.changeLanguage('fr');
    i18n.t('missingInFrench');

    await vi.waitFor(() =>
      expect(captureMessage).toHaveBeenCalledWith(
        'Missing translation "missingInFrench"',
        expect.objectContaining({
          tags: { 'i18n.language': 'fr', 'i18n.namespace': 'translation' },
        })
      )
    );
  });

  it('should report a missing key only once', async () => {
    i18n.t('reportedOnce');
    i18n.t('reportedOnce');

    await vi.waitFor(() => expect(captureMessage).toHaveBeenCalled());
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(captureMessage).toHaveBeenCalledTimes(1);
  });

  it('should not report keys that exist', async () => {
    i18n.t('lang');
    i18n.t('zod.required');

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('should not report keys found in the fallback language', async () => {
    await i18n.changeLanguage('fr');
    i18n.t('paymentMethod', { paymentMethod: 'bexio' });

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('should not report keys of a namespace that has not loaded', async () => {
    i18n.t('anything', { ns: 'notLoaded' });

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(captureMessage).not.toHaveBeenCalled();
  });
});

describe('applyTranslationOverrides', () => {
  let i18n: i18n;
  beforeEach(async () => {
    i18n = initWePublishTranslator();
    await i18n.changeLanguage('de');
  });

  it('should apply overrides to the locale they were written for', async () => {
    await applyTranslationOverrides(i18n, { de: { lang: 'Schweizerdeutsch' } });

    expect(i18n.t('lang')).toBe('Schweizerdeutsch');

    await i18n.changeLanguage('fr');
    expect(i18n.t('lang')).toBe('Français');
  });

  it('should apply French overrides only to French', async () => {
    await applyTranslationOverrides(i18n, { fr: { lang: 'Romand' } });

    expect(i18n.t('lang')).toBe('Deutsch');

    await i18n.changeLanguage('fr');
    expect(i18n.t('lang')).toBe('Romand');
  });

  it('should keep the base catalog underneath the overrides', async () => {
    await applyTranslationOverrides(i18n, { de: { lang: 'Schweizerdeutsch' } });

    expect(i18n.t('zod.required')).toBe('Erforderlich');
  });

  it('should remove previous overrides when switching back to none', async () => {
    await applyTranslationOverrides(i18n, {
      de: { lang: 'Schweizerdeutsch', extra: 'Zusatz' },
    });
    await applyTranslationOverrides(i18n, {});

    expect(i18n.t('lang')).toBe('Deutsch');
    expect(i18n.exists('extra')).toBe(false);
  });

  it('should keep the current language', async () => {
    await i18n.changeLanguage('fr');
    await applyTranslationOverrides(i18n, { fr: { lang: 'Romand' } });

    expect(i18n.language).toBe('fr');
    expect(i18n.t('lang')).toBe('Romand');
  });

  it('should emit languageChanged so react-i18next re-renders', async () => {
    const listener = vi.fn();
    i18n.on('languageChanged', listener);

    await applyTranslationOverrides(i18n, { de: { lang: 'Schweizerdeutsch' } });
    i18n.off('languageChanged', listener);

    expect(listener).toHaveBeenCalledWith('de');
  });
});
