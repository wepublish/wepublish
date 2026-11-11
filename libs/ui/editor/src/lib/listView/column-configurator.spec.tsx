import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { ColumnConfigurator } from './column-configurator';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

const columns = [
  { id: 'title', label: 'Title', canHide: true },
  { id: 'author', label: 'Author', canHide: true },
];

const renderConfigurator = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const open = () =>
  fireEvent.click(
    screen.getByRole('button', { name: /columnConfigurator.title/ })
  );

describe('ColumnConfigurator', () => {
  it('offers a way back to the layout the list came with', () => {
    const onReset = vi.fn();

    renderConfigurator(
      <ColumnConfigurator
        columns={columns}
        isVisible={() => true}
        onToggle={vi.fn()}
        onMove={vi.fn()}
        onReset={onReset}
        canReset
      />
    );

    open();
    fireEvent.click(screen.getByText('columnConfigurator.reset'));

    expect(onReset).toHaveBeenCalled();
  });

  it('has nothing to reset while the table looks as it always did', () => {
    renderConfigurator(
      <ColumnConfigurator
        columns={columns}
        isVisible={() => true}
        onToggle={vi.fn()}
        onMove={vi.fn()}
        onReset={vi.fn()}
      />
    );

    open();

    expect(
      screen.getByText('columnConfigurator.reset').closest('li')
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('offers a handle to drag each column into place', () => {
    renderConfigurator(
      <ColumnConfigurator
        columns={columns}
        isVisible={() => true}
        onToggle={vi.fn()}
        onMove={vi.fn()}
      />
    );

    open();

    expect(
      screen.getAllByLabelText('columnConfigurator.dragToReorder')
    ).toHaveLength(2);
  });

  it('leaves the handles out when the order cannot be changed', () => {
    renderConfigurator(
      <ColumnConfigurator
        columns={columns}
        isVisible={() => true}
        onToggle={vi.fn()}
      />
    );

    open();

    expect(
      screen.queryByLabelText('columnConfigurator.dragToReorder')
    ).toBeNull();
  });

  it('lets a column that must stay be moved but not switched off', () => {
    const onToggle = vi.fn();

    renderConfigurator(
      <ColumnConfigurator
        columns={[{ id: 'title', label: 'Title', canHide: false }]}
        isVisible={() => true}
        onToggle={onToggle}
        onMove={vi.fn()}
      />
    );

    open();
    fireEvent.click(screen.getByText('Title'));

    expect(onToggle).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText('columnConfigurator.dragToReorder')
    ).toBeInTheDocument();
  });

  it('still switches a column off when its row is clicked', () => {
    const onToggle = vi.fn();

    renderConfigurator(
      <ColumnConfigurator
        columns={columns}
        isVisible={() => true}
        onToggle={onToggle}
        onMove={vi.fn()}
      />
    );

    open();
    fireEvent.click(screen.getByText('Author'));

    expect(onToggle).toHaveBeenCalledWith('author');
  });

  it('keeps the drag handle out of the keyboard order and the item name', () => {
    renderConfigurator(
      <ColumnConfigurator
        columns={columns}
        isVisible={() => true}
        onToggle={vi.fn()}
        onMove={vi.fn()}
      />
    );

    open();

    expect(
      screen.queryByRole('button', { name: 'columnConfigurator.dragToReorder' })
    ).toBeNull();
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Title' })
    ).toBeInTheDocument();
  });

  it('moves a column down with Alt and the down arrow', () => {
    const onMove = vi.fn();

    renderConfigurator(
      <ColumnConfigurator
        columns={columns}
        isVisible={() => true}
        onToggle={vi.fn()}
        onMove={onMove}
      />
    );

    open();
    fireEvent.keyDown(screen.getByRole('menuitemcheckbox', { name: 'Title' }), {
      key: 'ArrowDown',
      altKey: true,
    });

    expect(onMove).toHaveBeenCalledWith('title', 'author');
  });

  it('moves a column up with Alt and the up arrow', () => {
    const onMove = vi.fn();

    renderConfigurator(
      <ColumnConfigurator
        columns={columns}
        isVisible={() => true}
        onToggle={vi.fn()}
        onMove={onMove}
      />
    );

    open();
    fireEvent.keyDown(
      screen.getByRole('menuitemcheckbox', { name: 'Author' }),
      { key: 'ArrowUp', altKey: true }
    );

    expect(onMove).toHaveBeenCalledWith('author', 'title');
  });

  it('tells assistive technology about the shortcut', () => {
    renderConfigurator(
      <ColumnConfigurator
        columns={columns}
        isVisible={() => true}
        onToggle={vi.fn()}
        onMove={vi.fn()}
      />
    );

    open();

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Title' })
    ).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowUp Alt+ArrowDown');
  });

  it('does nothing past the end of the list', () => {
    const onMove = vi.fn();

    renderConfigurator(
      <ColumnConfigurator
        columns={columns}
        isVisible={() => true}
        onToggle={vi.fn()}
        onMove={onMove}
      />
    );

    open();
    fireEvent.keyDown(
      screen.getByRole('menuitemcheckbox', { name: 'Author' }),
      { key: 'ArrowDown', altKey: true }
    );

    expect(onMove).not.toHaveBeenCalled();
  });
});
