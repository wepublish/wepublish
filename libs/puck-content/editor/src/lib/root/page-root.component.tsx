import {
  DocumentLayout,
  DocumentLayoutFooter,
  DocumentLayoutNavbar,
} from '@wepublish/puck-content/website';

import { PuckRootRender } from '../config.types';
import { DocumentLayoutNoInteraction } from './document-layout-chrome.styles';

export const PageRoot: PuckRootRender<'page'> = ({
  children,
  showNavigation,
  showFooter,
}) => (
  <DocumentLayout
    showNavigation={showNavigation}
    showFooter={showFooter}
    navigation={
      <DocumentLayoutNoInteraction>
        <DocumentLayoutNavbar />
      </DocumentLayoutNoInteraction>
    }
    footer={
      <DocumentLayoutNoInteraction>
        <DocumentLayoutFooter />
      </DocumentLayoutNoInteraction>
    }
  >
    {children}
  </DocumentLayout>
);
