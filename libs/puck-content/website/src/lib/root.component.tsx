import styled from '@emotion/styled';
import { PuckComponent, PuckContext } from '@puckeditor/core';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { memo } from 'react';

import { RootSEO, RootSEOProps } from './root-seo.component';

export type RootProps = RootSEOProps & {
  showFooter: boolean;
  showNavigation: boolean;
};

const Container = styled('div')`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const NoInteraction = styled('div')`
  * {
    pointer-events: none !important;
  }
`;

const Render = ({
  DropZone,
  showFooter,
  showNavigation,
}: {
  DropZone: PuckContext['renderDropZone'];
  showFooter: boolean;
  showNavigation: boolean;
}) => (
  <Container>
    {showNavigation && (
      <NoInteraction>
        <NavbarContainer
          categorySlugs={[['categories', 'about-us']]}
          slug="main"
          headerSlug="header"
          iconSlug="icons"
        />
      </NoInteraction>
    )}

    <DropZone
      zone="default-zone"
      collisionAxis="y"
      style={{ flexGrow: 1 }}
    />

    {showFooter && (
      <NoInteraction>
        <FooterContainer
          slug="footer"
          categorySlugs={[['categories', 'about-us']]}
          iconSlug="icons"
        />
      </NoInteraction>
    )}
  </Container>
);

// Improves performance by a lot as it doesn't need to rerender anymore when any props change
export const RootRender = memo(Render);

export const Root: PuckComponent<RootProps> = ({
  puck: { renderDropZone },
  showFooter,
  showNavigation,
  seo,
  socialMedia,
}) => (
  <>
    <RootSEO
      seo={seo}
      socialMedia={socialMedia}
    />

    <RootRender
      DropZone={renderDropZone}
      showFooter={showFooter}
      showNavigation={showNavigation}
    />
  </>
);
