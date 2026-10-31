import { RootSEO } from '../../root-seo.component';
import { PuckRootRender } from '../document';
import { DocumentLayout } from '../document-layout.component';

export const ArticleRoot: PuckRootRender<'article'> = ({
  children,
  ...props
}) => (
  <>
    <RootSEO
      kind="article"
      {...props}
    />

    <DocumentLayout>{children}</DocumentLayout>
  </>
);
