import { Plugin } from '@puckeditor/core';
import { createElement, ReactNode } from 'react';

import { BottomBarItem, BottomBarLayout } from './bottom-bar.component';

export const createBottomBarPlugin = (items: BottomBarItem[]): Plugin => ({
  name: 'bottom-bar',
  overrides: {
    puck: ({ children }: { children: ReactNode }) =>
      createElement(BottomBarLayout, { items, children }),
  },
});
