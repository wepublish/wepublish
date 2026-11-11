import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { SelectedItemsActions } from './selected-items-actions';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const renderActions = (selectedItems: string[]) => (
  <ThemeProvider theme={theme}>
    <SelectedItemsActions selectedItems={selectedItems}>
      <button type="button">Delete items</button>
    </SelectedItemsActions>
  </ThemeProvider>
);

describe('SelectedItemsActions', () => {
  it('keeps a quiet status region while nothing is selected', () => {
    render(renderActions([]));

    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('announces how many items are selected', () => {
    const { rerender } = render(renderActions([]));

    rerender(renderActions(['a', 'b']));

    expect(screen.getByRole('status')).toHaveTextContent(
      'selectableItemsActions.selectedItems:{"numberOfItems":2}'
    );
  });
});
