import {
  pageRootSchema,
  PageRootProps,
  pageTagSelectField,
  rootFieldAi,
} from '@wepublish/puck-content/editor';

import { pageRootFieldTabs, withFieldTabs } from '../../field-tabs/field-tabs';
import { PuckRootConfig } from '../document';
import {
  rootGeneralFields,
  rootPropertiesFields,
  rootSeoFields,
  rootSocialMediaFields,
} from '../root-fields';
import { PageRoot } from './page-root.component';

const ai = (key: keyof PageRootProps) => rootFieldAi(pageRootSchema, key);

export const PageRootConfig = withFieldTabs<PuckRootConfig<'page'>>(
  {
    label: 'Page',
    fields: {
      ...rootGeneralFields(ai),
      tags: { ...pageTagSelectField('Tags'), ai: ai('tags') },
      hidden: { type: 'switch', label: 'Hidden', ai: ai('hidden') },
      showNavigation: {
        type: 'switch',
        label: 'Show Navbar',
        ai: ai('showNavigation'),
      },
      showFooter: {
        type: 'switch',
        label: 'Show Footer',
        ai: ai('showFooter'),
      },
      ...rootSeoFields(ai),
      ...rootSocialMediaFields(ai),
      ...rootPropertiesFields(ai),
    },
    defaultProps: {
      showFooter: true,
      showNavigation: true,
    },
    render: PageRoot,
  },
  pageRootFieldTabs
);
