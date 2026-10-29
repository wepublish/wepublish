import { render, screen } from '@testing-library/react';

import { TemplateLoadingBackdrop } from './templateLoadingBackdrop';

describe('TemplateLoadingBackdrop', () => {
  it('renders nothing while closed', () => {
    render(
      <TemplateLoadingBackdrop
        open={false}
        label="Loading template…"
      />
    );

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows the label on an opaque surface so it stays legible over the scrim', () => {
    render(
      <TemplateLoadingBackdrop
        open
        label="Loading template…"
      />
    );

    const status = screen.getByRole('status');

    expect(status.textContent).toContain('Loading template…');
    expect(status.closest('.MuiPaper-root')).not.toBeNull();
  });
});
