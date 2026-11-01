import i18next from 'i18next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initReactI18next } from 'react-i18next';

const en = JSON.parse(
  readFileSync(
    join(__dirname, '../../../apps/editor/src/app/locales/en.json'),
    'utf8'
  )
);

void i18next.use(initReactI18next).init({
  lng: 'en',
  resources: { en },
  initImmediate: false,
  interpolation: { escapeValue: false },
});
