import { Theme, useTheme } from '@emotion/react';
import { Plugin } from '@puckeditor/core';
import { createContext, useContext } from 'react';

import { WebsiteThemePreview } from './website-theme.component';

export const WebsiteThemeContext = createContext<Theme | undefined>(undefined);

export const useWebsiteTheme = () => {
  const theme = useTheme();

  return useContext(WebsiteThemeContext) ?? theme;
};

export const websiteThemePlugin: Plugin = {
  name: 'website-theme',
  overrides: {
    iframe: WebsiteThemePreview,
  },
};
