import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';

import { ListItem, OrderedList, UnorderedList } from './lists';

describe('Lists', () => {
  it('renders an unordered and an ordered list with their items in order', () => {
    renderWithProviders(
      <>
        <UnorderedList aria-label="unordered">
          <ListItem>One</ListItem>
          <ListItem>Two</ListItem>
        </UnorderedList>

        <OrderedList aria-label="ordered">
          <ListItem>Three</ListItem>
          <ListItem>Four</ListItem>
        </OrderedList>
      </>
    );

    const unordered = screen.getByRole('list', { name: 'unordered' });
    const ordered = screen.getByRole('list', { name: 'ordered' });

    expect(unordered.tagName).toBe('UL');
    expect(ordered.tagName).toBe('OL');
    expect(
      within(unordered)
        .getAllByRole('listitem')
        .map(item => item.textContent)
    ).toEqual(['One', 'Two']);
    expect(
      within(ordered)
        .getAllByRole('listitem')
        .map(item => item.textContent)
    ).toEqual(['Three', 'Four']);
  });

  it('adds a bottom gutter unless turned off', () => {
    renderWithProviders(
      <UnorderedList>
        <ListItem>With gutter</ListItem>
        <ListItem gutterBottom={false}>Without gutter</ListItem>
      </UnorderedList>
    );

    expect(screen.getByRole('list')).toHaveClass('MuiTypography-gutterBottom');
    expect(screen.getByText('With gutter')).toHaveClass(
      'MuiTypography-gutterBottom'
    );
    expect(screen.getByText('Without gutter')).not.toHaveClass(
      'MuiTypography-gutterBottom'
    );
  });
});
