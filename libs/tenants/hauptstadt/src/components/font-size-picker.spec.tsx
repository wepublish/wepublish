import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';

import { hauptstadtTenant } from '../hauptstadt-tenant';
import { FontSizePicker } from './font-size-picker';

describe('FontSizePicker', () => {
  it('is a dialog named after the font size setting', () => {
    renderWithProviders(
      <FontSizePicker
        open
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
      { tenant: hauptstadtTenant }
    );

    expect(
      screen.getByRole('dialog', { name: 'Schriftgrösse einstellen' })
    ).toBeInTheDocument();
  });

  it('closes through the submit button', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <FontSizePicker
        open
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
      { tenant: hauptstadtTenant }
    );

    await user.click(screen.getByRole('button', { name: 'Fertig' }));

    expect(onSubmit).toHaveBeenCalled();
  });
});
