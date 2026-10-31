import {
  DocumentLayout,
  DocumentLayoutFooter,
  DocumentLayoutNavbar,
  RootSEO,
  TeaserSlotRoot,
} from '@wepublish/puck-content/website';

import { PuckRootRender } from '../config.types';
import { DocumentLayoutNoInteraction } from './document-layout-chrome.styles';

export const PageRoot: PuckRootRender<'page'> = ({
  children,
  showNavigation,
  showFooter,
  ...props
}) => (
  <>
    <RootSEO
      kind="page"
      {...props}
    />

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
      <TeaserSlotRoot>{children}</TeaserSlotRoot>
    </DocumentLayout>
  </>
);
