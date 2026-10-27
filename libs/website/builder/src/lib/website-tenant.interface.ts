import { Theme, ThemeOptions } from '@mui/material';
import type { Locale } from 'date-fns';
import { ComponentType, PropsWithChildren } from 'react';
import { PartialDeep } from 'type-fest';
import { WebsiteBuilderProps } from './website-builder.context';

export type WebsiteTenantLanguage = 'de' | 'fr';

export type WebsiteTenantBuilderProps = PartialDeep<
  Omit<WebsiteBuilderProps, 'Head' | 'Script' | 'thirdParty'>
>;

export type WebsiteTenantConfig = {
  id: string;
  name: string;
  createTheme: (settingsTheme?: ThemeOptions) => Theme;
  builder: WebsiteTenantBuilderProps;
  blockStyles?: string[];
  translations: {
    lng: WebsiteTenantLanguage;
    overrides?: Partial<Record<WebsiteTenantLanguage, object>>;
  };
  dateLocale: Locale;
  GlobalStyles?: ComponentType;
  Wrapper?: ComponentType<PropsWithChildren>;
};
