import { DefaultRootProps, PuckContext, RootConfig } from '@measured/puck';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';
import { memo } from 'react';
import { Eye } from 'lucide-react';

export type RootProps = DefaultRootProps;

// Improves performance by a lot as it doesn't need to rerender anymore when any props change
const Rend = memo(
  ({
    DropZone,
    showFooter,
    showNavigation,
  }: {
    DropZone: PuckContext['renderDropZone'];
    showFooter: boolean;
    showNavigation: boolean;
  }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {showNavigation && (
        <NavbarContainer
          categorySlugs={[['categories', 'about-us']]}
          slug="main"
          headerSlug="header"
          iconSlug="icons"
          css={{ '*, &': { pointerEvents: 'none !important' } }}
        />
      )}

      <DropZone
        zone="default-zone"
        style={{ flexGrow: 1 }}
      />

      {showFooter && (
        <FooterContainer
          slug="footer"
          categorySlugs={[['categories', 'about-us']]}
          iconSlug="icons"
          css={{ '*, &': { pointerEvents: 'none !important' } }}
        />
      )}
    </div>
  )
);

export const root: RootConfig<{
  props: RootProps & { showNavigation: boolean; showFooter: boolean };
}> = {
  fields: {
    showNavigation: {
      type: 'radio',
      options: [
        { label: 'Show', value: true },
        { label: 'Hide', value: false },
      ],
      label: 'Navbar',
      labelIcon: <Eye size={16} />,
    },
    showFooter: {
      type: 'radio',
      options: [
        { label: 'Show', value: true },
        { label: 'Hide', value: false },
      ],
      label: 'Footer',
      labelIcon: <Eye size={16} />,
    },
  },
  defaultProps: {
    showFooter: true,
    showNavigation: true,
  },
  render: ({ puck: { renderDropZone }, showFooter, showNavigation }) => (
    <Rend
      DropZone={renderDropZone}
      showFooter={showFooter}
      showNavigation={showNavigation}
    />
  ),
};
