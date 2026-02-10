import { zodI18nMap } from 'zod-i18n-map';
import { initWePublishTranslator } from '@wepublish/utils/website';
import { z } from 'zod';
import i18next from 'i18next';

initWePublishTranslator();
z.setErrorMap(zodI18nMap);

export default i18next;
