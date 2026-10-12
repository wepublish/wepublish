import { render, screen } from '@testing-library/react';

import { ListInput } from './listInput';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ListInput', () => {
  it('does not clip the corners of the fields in an item', () => {
    render(
      <ListInput
        value={[{ id: 'a', value: 'key' }]}
        onChange={vi.fn()}
        defaultValue=""
      >
        {({ value }) => (
          <input
            data-testid="field"
            defaultValue={value}
          />
        )}
      </ListInput>
    );

    // the item panel is only a layout wrapper; rsuite's overflow: hidden
    // with the editor's larger panel radius cut off the fields' rounded
    // corners (and focus rings) at its edges
    const panel = screen.getByTestId('field').closest('.rs-panel');

    expect(getComputedStyle(panel as Element).overflow).toBe('visible');
  });
});
