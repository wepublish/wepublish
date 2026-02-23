import { zodI18nMap } from 'zod-i18n-map';
import { initWePublishTranslator } from '@wepublish/utils/website';
import { z } from 'zod';
import i18next from 'i18next';
import { faker } from '@faker-js/faker';

// Fix faker seed so mock data stays identical across Chromatic builds (no false-positive visual diffs)
faker.seed(123);

initWePublishTranslator();
z.setErrorMap(zodI18nMap);

export default i18next;
