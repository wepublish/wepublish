import i18n from 'i18next';

import { paletteSchema, typographyItem } from './schema';

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map(issue => issue.message);

describe('theme schema validation messages', () => {
  beforeAll(async () => {
    await i18n.init({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            websiteSettings: {
              theme: {
                invalidColor: 'Invalid colour',
                invalidLength: 'Needs a unit',
                lengthOutOfRange: 'Between {{min}} and {{max}}',
              },
            },
          },
        },
        de: {
          translation: {
            websiteSettings: {
              theme: {
                invalidColor: 'Ungültige Farbe',
                invalidLength: 'Braucht eine Einheit',
                lengthOutOfRange: 'Zwischen {{min}} und {{max}}',
              },
            },
          },
        },
      },
    });
  });

  afterEach(() => i18n.changeLanguage('en'));

  const invalidColor = () =>
    paletteSchema.shape.divider.safeParse('not-a-colour');

  it('translates an invalid colour', () => {
    expect(messages(invalidColor())).toEqual(['Invalid colour']);
  });

  it('translates a length without a unit', () => {
    expect(messages(typographyItem.shape.fontSize.safeParse('big'))).toContain(
      'Needs a unit'
    );
  });

  it('names the allowed range of a length that is out of range', () => {
    expect(messages(typographyItem.shape.fontSize.safeParse('100em'))).toEqual([
      'Between 0.5em and 6.5em',
    ]);
  });

  it('follows the language at validation time, not at import time', async () => {
    await i18n.changeLanguage('de');

    expect(messages(invalidColor())).toEqual(['Ungültige Farbe']);
    expect(messages(typographyItem.shape.fontSize.safeParse('100em'))).toEqual([
      'Zwischen 0.5em und 6.5em',
    ]);
  });
});
