import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { initWePublishTranslator } from '@wepublish/utils/website/i18n';
import { setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import i18next from 'i18next';
import { afterEach, beforeAll } from 'vitest';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';
import { setTestLocale } from './lib/render/locale';
import { preventDomNetworkAccess } from './lib/render/offline-dom';
import {
  DEFAULT_TEST_VIEWPORT_WIDTH,
  setTestViewportWidth,
} from './lib/render/viewport';

if (!i18next.isInitialized) {
  initWePublishTranslator();
}

preventDomNetworkAccess();
z.setErrorMap(zodI18nMap);
setDefaultOptions({ locale: de });

beforeAll(async () => {
  await i18next.loadLanguages(['de', 'fr']);

  if (i18next.language !== 'de') {
    await i18next.changeLanguage('de');
  }
});

afterEach(() => {
  cleanup();
  setTestLocale('de');
  setTestViewportWidth(DEFAULT_TEST_VIEWPORT_WIDTH);
});
