import { Plugin } from '@puckeditor/core';

import { SidebarLayout } from './sidebar-layout.component';

export const sidebarLayoutPlugin: Plugin = {
  name: 'sidebar-layout',
  overrides: {
    puck: SidebarLayout,
  },
};
