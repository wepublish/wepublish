import i18n from 'i18next';

import { initI18N } from './i18n';

describe('initI18N', () => {
  beforeAll(async () => {
    initI18N();
    await i18n.changeLanguage('en');
  });

  test('does not html-escape interpolated values', () => {
    expect(
      i18n.t('seoChecklist.completedBy', {
        name: 'WePublish Admin',
        date: '9/30/2026',
      })
    ).toBe('Checked by WePublish Admin on 9/30/2026');
  });

  test('keeps formatting dates', () => {
    expect(
      i18n.t('changelog.releasedAt', { date: new Date(2026, 8, 30) })
    ).toBe('Released on 30 Sep 2026');
  });
});
