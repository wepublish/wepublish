import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';
import { createRef } from 'react';

import { TextField } from './text-field';

describe('TextField', () => {
  it('reports every typed character', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <TextField
        label="Label"
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText('Label');
    await user.type(input, 'Hello');

    expect(input).toHaveValue('Hello');
    expect(onChange).toHaveBeenCalledTimes(5);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ target: input })
    );
  });

  it('marks the input as invalid and links the helper text', () => {
    renderWithProviders(
      <TextField
        label="Label"
        error
        helperText="Helper text"
      />
    );

    const input = screen.getByLabelText('Label');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Helper text');
  });

  it('disables the input', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <TextField
        label="Label"
        disabled
      />
    );

    const input = screen.getByLabelText('Label');
    await user.type(input, 'Hello');

    expect(input).toBeDisabled();
    expect(input).toHaveValue('');
  });

  it('forwards its ref to the root element', () => {
    const ref = createRef<HTMLInputElement>();

    renderWithProviders(
      <TextField
        label="Label"
        ref={ref}
      />
    );

    expect(ref.current).toContainElement(screen.getByLabelText('Label'));
  });
});
