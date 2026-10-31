import {
  DocumentLayout,
  DocumentLayoutFooter,
  DocumentLayoutNavbar,
  RootSEO,
  TeaserSlotRoot,
} from '@wepublish/puck-content/website';

import { PuckRootRender } from '../config.types';
import { DocumentLayoutNoInteraction } from './document-layout-chrome.styles';

export const ArticleRoot: PuckRootRender<'article'> = ({
  children,
  ...props
}) => (
  <>
    <RootSEO
      kind="article"
      {...props}
    />

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
      <TeaserSlotRoot>{children}</TeaserSlotRoot>
    </DocumentLayout>
  </>
);
