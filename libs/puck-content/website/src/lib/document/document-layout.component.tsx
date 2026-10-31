import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { memo, ReactNode } from 'react';

import {
  DocumentLayoutContainer,
  DocumentLayoutContent,
  DocumentLayoutNoInteraction,
} from './document-layout.styles';

export const DocumentLayoutNavbar = memo(function DocumentLayoutNavbar() {
  return (
    <DocumentLayoutNoInteraction>
      <NavbarContainer
        categorySlugs={[['categories', 'about-us']]}
        slug="main"
        headerSlug="header"
        iconSlug="icons"
      />
    </DocumentLayoutNoInteraction>
  );
});

export const DocumentLayoutFooter = memo(function DocumentLayoutFooter() {
  return (
    <DocumentLayoutNoInteraction>
      <FooterContainer
        slug="footer"
        categorySlugs={[['categories', 'about-us']]}
        iconSlug="icons"
      />
    </DocumentLayoutNoInteraction>
  );
});

export type DocumentLayoutProps = {
  children: ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
};

export const DocumentLayout = ({
  children,
  showNavigation = true,
  showFooter = true,
}: DocumentLayoutProps) => (
  <DocumentLayoutContainer>
    {showNavigation && <DocumentLayoutNavbar />}
    <DocumentLayoutContent>{children}</DocumentLayoutContent>
    {showFooter && <DocumentLayoutFooter />}
  </DocumentLayoutContainer>
);
