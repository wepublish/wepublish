import { render } from '@testing-library/react';
import i18next from 'i18next';
import ICU from 'i18next-icu';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { WelcomeIntro } from './welcome-intro';

// Same message format as the website: ICU.
const translator = async () => {
  const i18n = i18next.createInstance().use(ICU).use(initReactI18next);
  await i18n.init({
    lng: 'de',
    resources: {
      de: {
        translation: {
          welcome: {
            intro: 'Angemeldet.<br>Jetzt die E-Mail-Adresse.',
            introPlaceholder: 'Mit Code angemeldet.<br/>Bitte Adresse angeben.',
          },
        },
      },
    },
    interpolation: { escapeValue: false },
  });

  return i18n;
};

describe('WelcomeIntro', () => {
  it.each([
    [false, 'Angemeldet.', 'Jetzt die E-Mail-Adresse.'],
    [true, 'Mit Code angemeldet.', 'Bitte Adresse angeben.'],
  ])(
    'turns <br> in the text into a line break (placeholder email: %s)',
    async (placeholderEmail, before, after) => {
      const { container } = render(
        <I18nextProvider i18n={await translator()}>
          <WelcomeIntro placeholderEmail={placeholderEmail} />
        </I18nextProvider>
      );

      expect(container.querySelector('br')).not.toBeNull();
      expect(container.textContent).toBe(`${before}${after}`);
      expect(container.textContent).not.toContain('<br');
    }
  );
});
