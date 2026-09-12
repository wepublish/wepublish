import { PropsWithChildren } from 'react';
import { I18nextProvider } from 'react-i18next';

import { websiteI18n } from './website-i18n';

export const WebsiteTranslationsProvider = ({
  children,
}: PropsWithChildren) => (
  <I18nextProvider i18n={websiteI18n}>{children}</I18nextProvider>
);
