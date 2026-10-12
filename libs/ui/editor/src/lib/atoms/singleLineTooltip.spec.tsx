import { render, screen } from '@testing-library/react';

import { SingleLineTooltip } from './singleLineTooltip';

describe('SingleLineTooltip', () => {
  it('grows to its content instead of wrapping at the default 250px', () => {
    render(
      <SingleLineTooltip data-testid="tooltip">
        6f1c2a9e-3b7d-4e1a-9c2f-8d5e0b4a7c13
      </SingleLineTooltip>
    );

    const style = getComputedStyle(screen.getByTestId('tooltip'));

    expect(style.width).toBe('max-content');
    // the viewport width minus a gutter (jsdom resolves 100vw to 1024px)
    expect(style.maxWidth).toMatch(/^calc\(.+ - 32px\)$/);
  });
});
