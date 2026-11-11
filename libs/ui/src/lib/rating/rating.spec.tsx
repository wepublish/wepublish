import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';
import { MdFavorite, MdHeartBroken } from 'react-icons/md';

import { Rating } from './rating';

describe('Rating', () => {
  it('reports and checks the value chosen with the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <Rating
        name="rating"
        defaultValue={2}
        onChange={onChange}
      />
    );

    await user.tab();
    expect(screen.getByRole('radio', { name: '2 Stars' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: '3 Stars' })).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(expect.anything(), 3);
  });

  it('checks the given default value', () => {
    renderWithProviders(
      <Rating
        name="rating"
        defaultValue={4}
      />
    );

    expect(screen.getByRole('radio', { name: '4 Stars' })).toBeChecked();
  });

  it('cannot be changed when read only', () => {
    renderWithProviders(
      <Rating
        name="rating"
        defaultValue={4}
        readOnly
      />
    );

    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByRole('img', { name: '4 Stars' })).toBeInTheDocument();
  });

  it('shows the custom icon for filled values', () => {
    renderWithProviders(
      <Rating
        name="rating"
        defaultValue={2}
        icon={<MdFavorite data-testid="filled" />}
        emptyIcon={<MdHeartBroken data-testid="empty" />}
      />
    );

    expect(screen.getAllByTestId('filled')).not.toHaveLength(0);
    expect(screen.queryByTestId('empty')).not.toBeInTheDocument();
  });

  it('shows the empty icon everywhere when filled icons are turned off', () => {
    renderWithProviders(
      <Rating
        name="rating"
        defaultValue={3}
        showFilledIcon={false}
        icon={<MdFavorite data-testid="filled" />}
        emptyIcon={<MdHeartBroken data-testid="empty" />}
      />
    );

    expect(screen.getAllByTestId('empty')).not.toHaveLength(0);
    expect(screen.queryByTestId('filled')).not.toBeInTheDocument();
  });
});
