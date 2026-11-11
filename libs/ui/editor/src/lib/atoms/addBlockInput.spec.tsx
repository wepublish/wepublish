import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MdImage, MdTitle } from 'react-icons/md';

import { AddBlockInput, AddBlockMenuItem } from './addBlockInput';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

const ITEMS: AddBlockMenuItem[] = [
  {
    id: 'title',
    icon: <MdTitle />,
    label: 'blocks.title.label',
    group: 'text',
  },
  {
    id: 'quote',
    icon: <MdTitle />,
    label: 'blocks.quote.label',
    group: 'text',
  },
  {
    id: 'image',
    icon: <MdImage />,
    label: 'blocks.image.label',
    group: 'media',
  },
];

const openMenu = (items = ITEMS) => {
  const onMenuItemClick = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <AddBlockInput
        menuItems={items}
        onMenuItemClick={onMenuItemClick}
      />
    </ThemeProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'blockList.addBlock' }));

  return onMenuItemClick;
};

describe('AddBlockInput', () => {
  it('offers every block', () => {
    openMenu();

    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('reports the block that was picked', () => {
    const onMenuItemClick = openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: /blocks.image/ }));

    expect(onMenuItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'image' })
    );
  });

  it('puts a heading above each group', () => {
    openMenu();

    expect(screen.getByText('blocks.groups.text')).toBeInTheDocument();
    expect(screen.getByText('blocks.groups.media')).toBeInTheDocument();
  });

  it('exposes only menu items inside the menu, not stray list items', () => {
    openMenu();

    const menu = screen.getByRole('menu');

    expect(within(menu).queryAllByRole('listitem')).toHaveLength(0);
    expect(within(menu).getByText('blocks.groups.text')).toBeInTheDocument();
  });

  it('leaves out a heading no block belongs to', () => {
    openMenu([ITEMS[2]]);

    expect(screen.queryByText('blocks.groups.text')).not.toBeInTheDocument();
  });

  it('keeps the groups in a fixed order, whatever order the blocks arrive in', () => {
    openMenu([ITEMS[2], ITEMS[0]]);

    const menu = screen.getByRole('menu');
    const headings = within(menu)
      .getAllByText(/blocks\.groups\./)
      .map(node => node.textContent);

    expect(headings).toEqual(['blocks.groups.text', 'blocks.groups.media']);
  });

  it('scrolls rather than growing past the viewport', () => {
    openMenu();

    expect(screen.getByRole('menu').parentElement).toHaveStyle({
      overflowY: 'auto',
    });
  });
});
