import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { memo, ReactNode } from 'react';

import {
  DocumentLayoutContainer,
  DocumentLayoutContent,
} from './document-layout.styles';

export const DocumentLayoutNavbar = memo(function DocumentLayoutNavbar() {
  return (
    <NavbarContainer
      categorySlugs={[['categories', 'about-us']]}
      slug="main"
      headerSlug="header"
      iconSlug="icons"
    />
  );
});

export const DocumentLayoutFooter = memo(function DocumentLayoutFooter() {
  return (
    <FooterContainer
      slug="footer"
      categorySlugs={[['categories', 'about-us']]}
      iconSlug="icons"
    />
  );
});

export type DocumentLayoutProps = {
  children: ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
  navigation?: ReactNode;
  footer?: ReactNode;
};

export const DocumentLayout = ({
  children,
  showNavigation = true,
  showFooter = true,
  navigation = <DocumentLayoutNavbar />,
  footer = <DocumentLayoutFooter />,
}: DocumentLayoutProps) => (
  <DocumentLayoutContainer>
    {showNavigation && navigation}
    <DocumentLayoutContent>{children}</DocumentLayoutContent>
    {showFooter && footer}
  </DocumentLayoutContainer>
);
