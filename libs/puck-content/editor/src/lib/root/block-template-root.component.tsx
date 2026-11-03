import { DocumentLayout } from '@wepublish/puck-content/website';

import { PuckRootRender } from '../config.types';

export const BlockTemplateRoot: PuckRootRender<'page'> = ({ children }) => (
  <DocumentLayout
    showNavigation={false}
    showFooter={false}
  >
    {children}
  </DocumentLayout>
);
