import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { bexioContactSyncField } from './bexioContactSyncField';

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key} ${JSON.stringify(options)}` : key;

const renderField = (
  setting: {
    bexio_contactSyncAt?: string | null;
    bexio_contactSyncError?: string | null;
  },
  value = true
) => {
  const onChange = vi.fn();
  const { render: Field } = bexioContactSyncField(setting, t);

  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <Field
        value={value}
        onChange={onChange}
      />
    </ThemeProvider>
  );

  return { onChange };
};

describe('bexioContactSyncField', () => {
  it('switches the sync on and off', () => {
    const { onChange } = renderField({}, false);

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('says plainly, not in the tooltip, that the sync never ran', () => {
    renderField({});

    expect(screen.getByRole('status').textContent).toContain(
      'integrations.paymentSettings.bexioContactSyncNeverRan'
    );
  });

  it('shows a clean run as a success', () => {
    renderField({ bexio_contactSyncAt: '2026-11-07T03:00:08Z' });

    const status = screen.getByRole('status');
    expect(status.textContent).toContain(
      'integrations.paymentSettings.bexioContactSyncLastRun'
    );
    expect(status.className).toMatch(/Success/);
  });

  it('shows readers bexio refused as a warning, with the reason in view', () => {
    renderField({
      bexio_contactSyncAt: '2026-11-07T03:00:08Z',
      bexio_contactSyncError:
        '7 of 1821 readers failed: 422 The form could not be saved due to the following errors: mail is invalid',
    });

    const status = screen.getByRole('status');
    expect(status.className).toMatch(/Warning/);
    expect(status.textContent).toContain('mail is invalid');
  });

  it.each([
    'bexio rejects the API key (HTTP 401); stopped at the first of 1821 readers.',
    '1821 of 1821 readers failed: 500 Internal Server Error',
  ])('shows a sync that got nowhere as an error: %s', error => {
    renderField({
      bexio_contactSyncAt: '2026-11-07T03:00:08Z',
      bexio_contactSyncError: error,
    });

    expect(screen.getByRole('status').className).toMatch(/Error/);
  });

  it('shows no status while the sync is off', () => {
    renderField({ bexio_contactSyncAt: '2026-11-07T03:00:08Z' }, false);

    expect(screen.queryByRole('status')).toBeNull();
  });
});
