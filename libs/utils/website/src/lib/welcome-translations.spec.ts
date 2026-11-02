import de from '@wepublish/website/translations/de.json';
import fr from '@wepublish/website/translations/fr.json';
import i18next from 'i18next';
import ICU from 'i18next-icu';

// Same message format as the website (`initWePublishTranslator`): ICU, so a
// variable is written `{email}`, not `{{email}}`.
const translator = async (lng: 'de' | 'fr') => {
  const i18n = i18next.createInstance().use(ICU);
  await i18n.init({
    lng,
    resources: { de: { translation: de }, fr: { translation: fr } },
    interpolation: { escapeValue: false },
  });

  return i18n;
};

describe('welcome page translations', () => {
  it.each(['de', 'fr'] as const)(
    'fill in the email address (%s)',
    async lng => {
      const i18n = await translator(lng);

      for (const key of ['welcome.emailVerifyInfo', 'welcome.emailSent']) {
        const text = i18n.t(key, { email: 'reader@example.com' });

        expect(text).toContain('reader@example.com');
        expect(text).not.toContain('{');
      }
    }
  );
});
