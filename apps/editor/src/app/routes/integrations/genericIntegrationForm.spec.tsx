import { createTheme, ThemeProvider } from '@mui/material';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { UpdateMailProviderSettingDocument } from '@wepublish/editor/api';
import { z } from 'zod';

import { SingleGenericIntegrationForm } from './genericIntegrationForm';

const { updateSettings } = vi.hoisted(() => ({ updateSettings: vi.fn() }));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: () => [updateSettings, { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const saveWithPort = async (typed: string) => {
  const { container } = render(
    <SingleGenericIntegrationForm
      setting={{ id: 'smtp', type: 'SMTP', smtp_port: 25 } as never}
      schema={z.object({ smtp_port: z.number().int().min(1).nullish() })}
      mutation={UpdateMailProviderSettingDocument}
      fields={[{ type: 'number', name: 'smtp_port', label: 'Port' }]}
    />
  );
  const input = container.querySelector(
    'input[name="smtp_port"]'
  ) as HTMLInputElement;

  await act(() => fireEvent.change(input, { target: { value: typed } }));
  await act(() =>
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
  );
};

describe('SingleGenericIntegrationForm number fields', () => {
  beforeEach(() => updateSettings.mockReset().mockResolvedValue({}));

  it('saves a typed number as a number', async () => {
    await saveWithPort('587');

    expect(updateSettings).toHaveBeenCalledWith({
      variables: { id: 'smtp', smtp_port: 587 },
    });
  });

  it('saves an emptied number field as unset, not as 0', async () => {
    await saveWithPort('');

    expect(updateSettings).toHaveBeenCalledWith({
      variables: { id: 'smtp', smtp_port: null },
    });
  });
});

describe('SingleGenericIntegrationForm labels', () => {
  it('names every control after its visible label, without the info text', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <SingleGenericIntegrationForm
          setting={
            {
              id: 'smtp',
              type: 'SMTP',
              name: 'Mail',
              apiKey: '',
              notes: '',
              scopes: [],
            } as never
          }
          schema={z.object({
            type: z.string(),
            name: z.string(),
            apiKey: z.string(),
            notes: z.string(),
            scopes: z.array(z.string()),
          })}
          mutation={UpdateMailProviderSettingDocument}
          fields={[
            {
              type: 'select',
              name: 'type',
              label: 'Type',
              info: 'Which provider',
              options: [{ label: 'SMTP', value: 'SMTP' }],
            },
            {
              type: 'text',
              name: 'name',
              label: 'Name',
              info: 'Shown in lists',
            },
            { type: 'password', name: 'apiKey', label: 'API key' },
            { type: 'textarea', name: 'notes', label: 'Notes' },
            {
              type: 'checkPicker',
              name: 'scopes',
              label: 'Scopes',
              options: [{ label: 'Read', value: 'read' }],
            },
          ]}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('combobox', { name: /^Type/ })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeTruthy();
    expect(screen.getByLabelText('API key')).toHaveAttribute(
      'type',
      'password'
    );
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Scopes' })).toBeTruthy();
  });
});

describe('SingleGenericIntegrationForm guidance', () => {
  const renderStripe = (setting: Record<string, unknown>) =>
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <SingleGenericIntegrationForm
          integrationKey="payment"
          providers={[{ type: 'STRIPE', label: 'Stripe (embedded)' }]}
          setting={{ id: 'stripe', type: 'STRIPE', ...setting } as never}
          schema={z.object({ apiKey: z.string().nullish() })}
          mutation={UpdateMailProviderSettingDocument}
          fields={[
            {
              type: 'password',
              name: 'apiKey',
              label: 'API key',
              info: 'Starts with sk_live_',
              section: 'Connection',
            },
          ]}
        />
      </ThemeProvider>
    );

  it('shows the help of a field below it instead of in a tooltip', () => {
    renderStripe({});

    expect(screen.getByLabelText('API key')).toHaveAccessibleDescription(
      'Starts with sk_live_'
    );
    expect(screen.getByText('Starts with sk_live_')).toBeVisible();
  });

  it('heads groups of fields with their section', () => {
    renderStripe({});

    expect(
      screen.getByRole('heading', { name: 'Connection' })
    ).toBeInTheDocument();
  });

  it('names the provider by what it is, not by its enum', () => {
    renderStripe({});

    expect(
      screen.getByRole('heading', { name: 'Stripe (embedded)' })
    ).toBeInTheDocument();
  });

  it('names each provider form after its provider, to tell several apart', () => {
    renderStripe({ name: 'Shop checkout' });

    expect(
      screen.getByRole('form', { name: 'Shop checkout' })
    ).toBeInTheDocument();
  });

  it('opens the setup guide while credentials are missing', () => {
    renderStripe({ isApiKeySet: false });

    expect(
      screen.getByRole('button', { name: /integrations.guide.title/ })
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('integrations.status.incomplete')).toBeTruthy();
  });

  it('keeps the guide out of the way once the provider is ready', () => {
    renderStripe({ isApiKeySet: true });

    expect(
      screen.getByRole('button', { name: /integrations.guide.title/ })
    ).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('integrations.status.ready')).toBeTruthy();
  });
});

describe('SingleGenericIntegrationForm editing', () => {
  const renderName = () =>
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <SingleGenericIntegrationForm
          setting={
            { id: 'smtp', type: 'SMTP', name: 'Mail', active: true } as never
          }
          schema={z.object({
            name: z.string().nullish(),
            active: z.boolean().nullish(),
          })}
          mutation={UpdateMailProviderSettingDocument}
          fields={[
            { type: 'text', name: 'name', label: 'Name' },
            { type: 'checkbox', name: 'active', label: 'Active' },
          ]}
        />
      </ThemeProvider>
    );

  it('only offers to save once something changed', async () => {
    renderName();

    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
    expect(screen.queryByText('integrations.form.unsaved')).toBeNull();

    await act(() =>
      fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
        target: { value: 'Newsletter mail' },
      })
    );

    expect(screen.getByRole('button', { name: 'save' })).toBeEnabled();
    expect(screen.getByText('integrations.form.unsaved')).toBeInTheDocument();
  });

  it('throws unsaved changes away on request', async () => {
    renderName();
    const name = screen.getByRole('textbox', { name: 'Name' });

    await act(() =>
      fireEvent.change(name, { target: { value: 'Newsletter mail' } })
    );
    await act(() =>
      fireEvent.click(
        screen.getByRole('button', { name: 'integrations.form.discard' })
      )
    );

    expect(name).toHaveValue('Mail');
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
  });

  it('shows on/off options as switches', () => {
    renderName();

    expect(screen.getByRole('switch', { name: 'Active' })).toBeChecked();
  });
});

describe('SingleGenericIntegrationForm as a wizard', () => {
  const renderWizard = (setting: Record<string, unknown>) =>
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <SingleGenericIntegrationForm
          setting={{ id: 'bexio', type: 'BEXIO', ...setting } as never}
          schema={z.object({
            apiKey: z.string().nullish(),
            bexio_accountId: z.coerce.number().nullish(),
          })}
          mutation={UpdateMailProviderSettingDocument}
          fields={[
            {
              type: 'password',
              name: 'apiKey',
              label: 'API token',
              section: 'Connection',
            },
            {
              type: 'number',
              name: 'bexio_accountId',
              label: 'Revenue account',
              section: 'Records',
            },
          ]}
          steps={current => [
            {
              title: 'Connect',
              sections: ['Connection'],
              complete: !!current.isApiKeySet,
            },
            {
              title: 'Records',
              sections: ['Records'],
              complete: !!current.bexio_accountId,
            },
          ]}
          useLookups={current =>
            current.isApiKeySet ?
              { bexio_accountId: [{ label: '3400 Abonnemente', value: 7 }] }
            : undefined
          }
        />
      </ThemeProvider>
    );

  it('asks for the token first and keeps what needs it for later', () => {
    renderWizard({});

    expect(screen.getByRole('tab', { name: /Connect/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByLabelText('API token')).toBeInTheDocument();
    expect(screen.queryByText('Revenue account')).toBeNull();
    expect(screen.getByRole('tab', { name: /Records/ })).toBeDisabled();
  });

  it('continues where the setup was left off, choosing from what the provider has', () => {
    renderWizard({ isApiKeySet: true });

    expect(screen.getByRole('tab', { name: /Records/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.queryByLabelText('API token')).toBeNull();

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'Revenue account' })
    );
    expect(
      screen.getByRole('option', { name: '3400 Abonnemente' })
    ).toBeInTheDocument();
  });

  it('goes back to an earlier step with back', () => {
    renderWizard({ isApiKeySet: true });

    fireEvent.click(screen.getByRole('button', { name: 'wizard.back' }));

    expect(screen.getByLabelText('API token')).toBeInTheDocument();
  });
});
