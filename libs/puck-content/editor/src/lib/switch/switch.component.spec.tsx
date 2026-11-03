import { render, screen } from '@testing-library/react';

import { SwitchFieldRender } from './switch.component';

const renderSwitch = (value: boolean | undefined, defaultValue?: boolean) =>
  render(
    <SwitchFieldRender
      id="switch"
      name="switch"
      field={{ type: 'switch', label: 'Hide when empty', defaultValue }}
      value={value}
      onChange={vi.fn()}
    />
  );

describe('SwitchFieldRender', () => {
  it('shows an unset value as off', () => {
    renderSwitch(undefined);

    expect(
      screen.getByRole('switch', { name: 'Hide when empty' })
    ).not.toBeChecked();
  });

  it('shows an unset value as the default the block falls back to', () => {
    renderSwitch(undefined, true);

    expect(
      screen.getByRole('switch', { name: 'Hide when empty' })
    ).toBeChecked();
  });

  it('shows a stored value over the default', () => {
    renderSwitch(false, true);

    expect(
      screen.getByRole('switch', { name: 'Hide when empty' })
    ).not.toBeChecked();
  });
});
