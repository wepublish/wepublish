import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  PermissionListDocument,
  TinyOrganizationListDocument,
} from '@wepublish/editor/api';
import {
  CanGetArticle,
  CanGetOtherOrganizationEvents,
  CanGetPage,
  CanUpdateOtherOrganizations,
  Permission,
} from '@wepublish/permissions';
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

const sessionWith = (...permissions: Permission[]) =>
  ({
    sessionRoles: [{ id: 'role', name: 'admin', permissions }],
  }) as never;

const renderPanel = (session = sessionWith(CanGetArticle)) =>
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

const dampfzentrale = {
  __typename: 'Organization',
  id: 'org-a',
  name: 'Dampfzentrale',
};

const organizationQueries = () =>
  (useQuery as Mock).mock.calls.filter(
    call => call[0] === TinyOrganizationListDocument
  );

const organizationField = () =>
  screen.getByRole('combobox', { name: /panels.organization/ });

const pickTheOnlyOrganization = async () => {
  fireEvent.mouseDown(organizationField());
  fireEvent.click(await screen.findByRole('option', { name: 'Dampfzentrale' }));
};

const pickScope = async (permission: Permission) => {
  fireEvent.keyDown(screen.getByRole('combobox', { name: /panels.scopes/ }), {
    key: 'ArrowDown',
  });
  fireEvent.click(
    await screen.findByRole('option', { name: permission.description })
  );
};

const offeredScopes = async () => {
  fireEvent.keyDown(screen.getByRole('combobox', { name: /panels.scopes/ }), {
    key: 'ArrowDown',
  });

  return (await screen.findAllByRole('option')).map(
    option => option.textContent
  );
};

describe('ApiTokenGeneratePanel', () => {
  beforeEach(() => {
    create.mockClear();
    (useQuery as Mock).mockReset();
    (useQuery as Mock).mockImplementation((document: unknown) => {
      if (document === TinyOrganizationListDocument) {
        return {
          data: { organizations: { nodes: [dampfzentrale] } },
          loading: false,
        };
      }

      if (document === PermissionListDocument) {
        return {
          data: {
            permissions: [
              CanGetArticle,
              CanGetPage,
              CanGetOtherOrganizationEvents,
            ],
          },
          loading: false,
        };
      }

      return { data: undefined, loading: false };
    });
  });

  it('offers a member only their own organisations to bind the key to', () => {
    renderPanel();

    expect(organizationQueries().at(-1)?.[1]?.variables?.filter).toEqual({
      mine: true,
    });
  });

  it('offers every organisation to whoever may update any of them', () => {
    renderPanel(sessionWith(CanGetArticle, CanUpdateOtherOrganizations));

    expect(organizationQueries().at(-1)?.[1]?.variables?.filter).toEqual({});
  });

  it('binds the key to the organisation picked', async () => {
    renderPanel();

    nameIt('Dampfzentrale import');
    await pickTheOnlyScope();
    await pickTheOnlyOrganization();

    fireEvent.change(expiryField(), { target: { value: '31.12.2027' } });

    await submit();

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0].variables.organizationId).toBe('org-a');
  });

  it('creates a platform key when no organisation is picked', async () => {
    renderPanel();

    nameIt('Ginto import');
    await pickTheOnlyScope();

    fireEvent.change(expiryField(), { target: { value: '31.12.2027' } });

    await submit();

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0].variables.organizationId).toBeNull();
  });

  it('stops offering cross-organisation permissions once the key is bound to an organisation', async () => {
    renderPanel(sessionWith(CanGetArticle, CanGetOtherOrganizationEvents));

    expect(await offeredScopes()).toHaveLength(2);
    fireEvent.keyDown(screen.getByRole('combobox', { name: /panels.scopes/ }), {
      key: 'Escape',
    });

    await pickTheOnlyOrganization();

    expect(await offeredScopes()).toEqual([CanGetArticle.description]);
  });

  it('drops a cross-organisation permission already picked when an organisation is chosen', async () => {
    renderPanel(sessionWith(CanGetArticle, CanGetOtherOrganizationEvents));

    nameIt('Dampfzentrale import');
    await pickScope(CanGetOtherOrganizationEvents);
    await pickScope(CanGetArticle);

    await pickTheOnlyOrganization();

    fireEvent.change(expiryField(), { target: { value: '31.12.2027' } });

    await submit();

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0].variables).toMatchObject({
      scopes: [CanGetArticle.id],
      organizationId: 'org-a',
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
