import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CanGetArticle, CanGetPage } from '@wepublish/permissions';
import type { Mock } from 'vitest';

import { AuthContext } from '../authContext';
import { ApiTokenGeneratePanel } from './apiTokenGeneratePanel';

const create = vi.fn(async () => ({
  data: { createApiToken: { token: 'wep_secret' } },
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [create, { loading: false }],
}));

const theme = createTheme({ cssVariables: true });

const session = {
  sessionRoles: [{ id: 'role', name: 'admin', permissions: [CanGetArticle] }],
} as never;

const renderPanel = () =>
  render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider value={{ session }}>
        <ApiTokenGeneratePanel />
      </AuthContext.Provider>
    </ThemeProvider>
  );

const nameIt = (name: string) =>
  fireEvent.change(screen.getByRole('textbox', { name: /panels.name/ }), {
    target: { value: name },
  });

const pickTheOnlyScope = async () => {
  const scopes = screen.getByRole('combobox', { name: /panels.scopes/ });

  fireEvent.keyDown(scopes, { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: /article/i }));
};

const expiryField = () =>
  screen.getByRole('textbox', { name: /panels.expiresAt/ });

const asTyped = (date: Date) =>
  [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('.');

const generateButton = () =>
  screen.getByRole('button', { name: /panels.generate/ });

const submit = async () => {
  await waitFor(() => expect(generateButton()).toBeEnabled());
  fireEvent.click(generateButton());
};

describe('ApiTokenGeneratePanel', () => {
  beforeEach(() => {
    create.mockClear();
    (useQuery as Mock).mockReturnValue({
      data: { permissions: [CanGetArticle, CanGetPage] },
      loading: false,
    });
  });

  it('only offers the permissions its creator holds', async () => {
    renderPanel();

    fireEvent.keyDown(screen.getByRole('combobox', { name: /panels.scopes/ }), {
      key: 'ArrowDown',
    });

    expect(await screen.findAllByRole('option')).toHaveLength(1);
  });

  it('sends the expiry date along with the key', async () => {
    renderPanel();

    nameIt('Ginto import');
    await pickTheOnlyScope();

    fireEvent.change(expiryField(), { target: { value: '31.12.2027' } });

    await waitFor(() => expect(expiryField()).toHaveValue('31.12.2027'));
    await submit();

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0].variables).toMatchObject({
      name: 'Ginto import',
      scopes: [CanGetArticle.id],
      expiresAt: new Date(2027, 11, 31, 23, 59, 59, 999).toISOString(),
    });
  });

  it('refuses a key that would never expire', async () => {
    renderPanel();

    nameIt('Forever');
    await pickTheOnlyScope();

    expect(generateButton()).toBeDisabled();

    fireEvent.click(generateButton());
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses an expiry more than three years out', async () => {
    renderPanel();

    nameIt('Too long');
    await pickTheOnlyScope();

    const tooLate = new Date();
    tooLate.setFullYear(tooLate.getFullYear() + 3);
    tooLate.setDate(tooLate.getDate() + 7);

    fireEvent.change(expiryField(), { target: { value: asTyped(tooLate) } });

    await waitFor(() =>
      expect(
        screen.getByText('apiTokenList.panels.expiresTooLate')
      ).toBeInTheDocument()
    );

    expect(generateButton()).toBeDisabled();
  });

  it('warns about a key that outlives a year', async () => {
    renderPanel();

    fireEvent.focus(expiryField());
    fireEvent.click(screen.getByRole('button', { name: /panels.in3Years/ }));

    expect(
      await screen.findByText('apiTokenList.panels.longLivedWarning')
    ).toBeInTheDocument();
  });

  it('stays quiet about a key that is gone within a year', async () => {
    renderPanel();

    fireEvent.focus(expiryField());
    fireEvent.click(screen.getByRole('button', { name: /panels.in90Days/ }));

    await waitFor(() => expect(expiryField()).not.toHaveValue(''));

    expect(
      screen.queryByText('apiTokenList.panels.longLivedWarning')
    ).toBeNull();
  });

  it('keeps its shortcuts inside the calendar rather than beside the field', () => {
    renderPanel();

    expect(
      screen.queryByRole('button', { name: /panels.in90Days/ })
    ).not.toBeInTheDocument();

    fireEvent.focus(expiryField());

    expect(
      screen.getByRole('button', { name: /panels.in90Days/ })
    ).toBeInTheDocument();
  });

  it('closes the calendar from its done button', () => {
    renderPanel();

    fireEvent.focus(expiryField());
    expect(
      screen.getByRole('button', { name: /panels.in90Days/ })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'dateTimePicker.done' })
    );

    expect(
      screen.queryByRole('button', { name: /panels.in90Days/ })
    ).not.toBeInTheDocument();
  });

  it('sets the expiry from a shortcut, to the end of that day', async () => {
    renderPanel();

    nameIt('Ninety days');
    await pickTheOnlyScope();

    fireEvent.focus(expiryField());
    fireEvent.click(screen.getByRole('button', { name: /panels.in90Days/ }));

    await submit();

    await waitFor(() => expect(create).toHaveBeenCalled());

    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);
    ninetyDays.setHours(23, 59, 59, 999);

    expect(create.mock.calls[0][0].variables.expiresAt).toBe(
      ninetyDays.toISOString()
    );
  });

  it('refuses an expiry that has already passed', async () => {
    renderPanel();

    nameIt('Stale');
    await pickTheOnlyScope();

    fireEvent.change(expiryField(), { target: { value: '01.01.2020' } });

    await waitFor(() =>
      expect(
        screen.getByText('apiTokenList.panels.expiresInThePast')
      ).toBeInTheDocument()
    );

    expect(generateButton()).toBeDisabled();

    fireEvent.click(generateButton());
    expect(create).not.toHaveBeenCalled();
  });
});
