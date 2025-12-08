import { DefaultRootProps, RootConfig } from '@measured/puck';
import {
  FooterContainer,
  NavbarContainer,
} from '@wepublish/navigation/website';

export type RootProps = DefaultRootProps;

export const root: RootConfig<{
  props: RootProps;
}> = {
  defaultProps: {
    title: 'My Page',
  },
  render: ({ puck: { renderDropZone: DropZone } }) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <NavbarContainer
          categorySlugs={[['categories', 'about-us']]}
          slug="main"
          headerSlug="header"
          iconSlug="icons"
        />

        <DropZone
          zone="default-zone"
          style={{ flexGrow: 1 }}
        />

        <FooterContainer
          slug="footer"
          categorySlugs={[['categories', 'about-us']]}
          iconSlug="icons"
        />
      </div>
    );
  },
};
