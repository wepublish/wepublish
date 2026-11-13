import '@testing-library/jest-dom/vitest';

import { PrintListIcon } from './print-list-icon';
import { renderWithRouter } from './test-utils';

describe('PrintListIcon', () => {
  it('stacks an arrow badge in the primary colour on a spreadsheet, leaving the label to the button around it', () => {
    const { container } = renderWithRouter(<PrintListIcon />);

    const icon = container.querySelector('[aria-hidden="true"]');

    expect(icon).not.toBeNull();
    expect(icon?.querySelectorAll('svg') ?? []).toHaveLength(2);
    expect(icon?.querySelector('[data-tone]')).toHaveAttribute(
      'data-tone',
      'primary'
    );
  });

  it('turns monochrome when disabled', () => {
    const { container } = renderWithRouter(<PrintListIcon disabled />);

    expect(container.querySelector('[data-tone]')).toHaveAttribute(
      'data-tone',
      'mono'
    );
  });
});
