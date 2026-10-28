import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';

import { Pagination } from './pagination';

describe('Pagination', () => {
  it('reports the page that was clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <Pagination
        count={10}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /\b2$/ }));

    expect(onChange).toHaveBeenCalledWith(expect.anything(), 2);
  });

  it('reports the next page from the next button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <Pagination
        count={10}
        page={4}
        onChange={onChange}
      />
    );

    expect(screen.getByRole('button', { name: /\b4$/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await user.click(screen.getByRole('button', { name: /next page/i }));

    expect(onChange).toHaveBeenCalledWith(expect.anything(), 5);
  });

  it('passes its className on to the navigation', () => {
    renderWithProviders(
      <Pagination
        count={10}
        className="custom-pagination"
      />
    );

    expect(screen.getByRole('navigation')).toHaveClass('custom-pagination');
  });
});
