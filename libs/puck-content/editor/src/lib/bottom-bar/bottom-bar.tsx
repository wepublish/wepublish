import { Plugin } from '@puckeditor/core';
import { PropsWithChildren } from 'react';

import { BottomBarItem, BottomBarLayout } from './bottom-bar.component';

export const createBottomBarPlugin = (items: BottomBarItem[]): Plugin => ({
  name: 'bottom-bar',
  overrides: {
    puck: ({ children }: PropsWithChildren) => (
      <BottomBarLayout items={items}>{children}</BottomBarLayout>
    ),
  },
});
