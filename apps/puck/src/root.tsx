import { DefaultRootProps, RootConfig } from '@puckeditor/core';

import { Eye } from 'lucide-react';
import { RootRender } from './root.component';

export type RootProps = DefaultRootProps;

export const root: RootConfig<{
  props: RootProps & { showNavigation: boolean; showFooter: boolean };
}> = {
  fields: {
    showNavigation: {
      type: 'radio',
      options: [
        { label: 'Show', value: true },
        { label: 'Hide', value: false },
      ],
      label: 'Navbar',
      labelIcon: <Eye size={16} />,
    },
    showFooter: {
      type: 'radio',
      options: [
        { label: 'Show', value: true },
        { label: 'Hide', value: false },
      ],
      label: 'Footer',
      labelIcon: <Eye size={16} />,
    },
  },
  defaultProps: {
    showFooter: true,
    showNavigation: true,
  },
  render: ({ puck: { renderDropZone }, showFooter, showNavigation }) => (
    <RootRender
      DropZone={renderDropZone}
      showFooter={showFooter}
      showNavigation={showNavigation}
    />
  ),
};
