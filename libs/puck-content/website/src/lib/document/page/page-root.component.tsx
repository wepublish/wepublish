import { RootSEO } from '../../root-seo.component';
import { PuckRootRender } from '../document';
import { DocumentLayout } from '../document-layout.component';

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
    >
      {children}
    </DocumentLayout>
  </>
);
