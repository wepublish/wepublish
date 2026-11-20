import { render } from '@testing-library/react';
import i18next from 'i18next';
import ICU from 'i18next-icu';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { WelcomeText } from './welcome-text';

// Same message format as the website: ICU.
const translator = async () => {
  const i18n = i18next.createInstance().use(ICU).use(initReactI18next);
  await i18n.init({
    lng: 'de',
    resources: {
      de: {
        translation: {
          welcome: {
            passwordInfo: 'Mit einem Passwort.<br>Ganz ohne Link.',
          },
        },
      },
    },
    interpolation: { escapeValue: false },
  });

  return i18n;
};

describe('WelcomeText', () => {
  it('turns <br> in the text into a line break', async () => {
    const { container } = render(
      <I18nextProvider i18n={await translator()}>
        <WelcomeText i18nKey="welcome.passwordInfo" />
      </I18nextProvider>
    );

    expect(container.querySelector('br')).not.toBeNull();
    expect(container.textContent).toBe('Mit einem Passwort.Ganz ohne Link.');
  });
});
