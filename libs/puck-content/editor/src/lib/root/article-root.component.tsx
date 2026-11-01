import {
  DocumentLayout,
  DocumentLayoutFooter,
  DocumentLayoutNavbar,
} from '@wepublish/puck-content/website';

import { PuckRootRender } from '../config.types';
import { DocumentLayoutNoInteraction } from './document-layout-chrome.styles';

export const ArticleRoot: PuckRootRender<'article'> = ({ children }) => (
  <DocumentLayout
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
