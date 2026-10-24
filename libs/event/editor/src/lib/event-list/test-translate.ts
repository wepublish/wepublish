export const translate = (key: string, options?: Record<string, unknown>) =>
  options ?
    `${key} ${Object.entries(options)
      .filter(([name]) => name !== 'defaultValue')
      .map(([, value]) => String(value))
      .join(' ')}`
  : key;

export const i18nMock = () => ({
  useTranslation: () => ({ t: translate, i18n: { language: 'en' } }),
});
