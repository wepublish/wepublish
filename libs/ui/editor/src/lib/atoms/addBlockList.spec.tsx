import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MdTitle } from 'react-icons/md';

import { AddBlockList } from './addBlockList';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

describe('AddBlockList', () => {
  it('offers every block as a button a keyboard can reach', () => {
    const onListItemClick = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <AddBlockList
          listItems={[
            { id: 'title', icon: <MdTitle />, label: 'blocks.title' },
          ]}
          onListItemClick={onListItemClick}
        />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: 'blocks.title' });
    fireEvent.click(button);

    expect(button.tagName).toBe('BUTTON');
    expect(onListItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'title' })
    );
  });
});
