import { render, screen } from '@testing-library/react';

import { SingleLineTooltip } from './singleLineTooltip';

describe('SingleLineTooltip', () => {
  it('grows to its content instead of wrapping at the default width', () => {
    render(
      <SingleLineTooltip
        open
        title="6f1c2a9e-3b7d-4e1a-9c2f-8d5e0b4a7c13"
      >
        <span>invoice</span>
      </SingleLineTooltip>
    );

    const style = getComputedStyle(
      screen.getByRole('tooltip').firstChild as Element
    );

    expect(style.width).toBe('max-content');
    expect(style.maxWidth).toMatch(/^calc\(.+ - 32px\)$/);
  });
});
