import { render } from '@testing-library/react';
import de from '@wepublish/website/translations/de.json';
import fr from '@wepublish/website/translations/fr.json';
import i18next from 'i18next';
import ICU from 'i18next-icu';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { WelcomeEmailInfo } from './welcome-email-info';

// The real translations, in the website's message format (ICU).
const translator = async (lng: 'de' | 'fr') => {
  const i18n = i18next.createInstance().use(ICU).use(initReactI18next);
  await i18n.init({
    lng,
    resources: { de: { translation: de }, fr: { translation: fr } },
    interpolation: { escapeValue: false },
  });

  return i18n;
};

describe('WelcomeEmailInfo', () => {
  it.each([
    ['de', 'welcome.emailVerifyInfo'],
    ['fr', 'welcome.emailVerifyInfo'],
    ['de', 'welcome.emailSent'],
    ['fr', 'welcome.emailSent'],
  ] as const)(
    'shows the email address in bold (%s, %s)',
    async (lng, i18nKey) => {
      const { container } = render(
        <I18nextProvider i18n={await translator(lng)}>
          <WelcomeEmailInfo
            i18nKey={i18nKey}
            email="reader@example.com"
          />
        </I18nextProvider>
      );

      const text = (lng === 'de' ? de : fr).welcome[
        i18nKey.split('.')[1] as 'emailVerifyInfo' | 'emailSent'
      ]
        .replace(/<\/?bold>/g, '')
        .replace('{email}', 'reader@example.com');

      expect(container.textContent).toBe(text);
      expect(container.querySelector('strong')?.textContent).toBe(
        'reader@example.com'
      );
    }
  );
});
