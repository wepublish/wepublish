import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TinyOrganizationFragment } from '@wepublish/editor/api';
import { useState } from 'react';
import type { Mock } from 'vitest';

import { OrganizationSelectPicker } from './organizationSelectPicker';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const dampfzentrale = {
  __typename: 'Organization' as const,
  id: 'org-a',
  name: 'Dampfzentrale',
};
const reitschule = {
  __typename: 'Organization' as const,
  id: 'org-b',
  name: 'Reitschule',
};

function Picker({
  mine,
  disableClearable,
}: {
  mine?: boolean;
  disableClearable?: boolean;
}) {
  const [organization, setOrganization] =
    useState<TinyOrganizationFragment | null>(null);

  return (
    <OrganizationSelectPicker
      label="organization"
      mine={mine}
      disableClearable={disableClearable}
      value={organization}
      onChange={setOrganization}
    />
  );
}

const renderPicker = (mine?: boolean, disableClearable?: boolean) =>
  render(
    <ThemeProvider theme={theme}>
      <Picker
        mine={mine}
        disableClearable={disableClearable}
      />
    </ThemeProvider>
  );

const combobox = () =>
  screen.getByRole('combobox', { name: 'organization' }) as HTMLInputElement;

const lastFilter = () =>
  mockedUseQuery.mock.calls.at(-1)?.[1]?.variables?.filter;

beforeEach(() => {
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { organizations: { nodes: [dampfzentrale, reitschule] } },
    loading: false,
  });
});

describe('OrganizationSelectPicker', () => {
  it('shows the name of the organisation that was picked', async () => {
    renderPicker();

    fireEvent.mouseDown(combobox());
    fireEvent.click(await screen.findByText('Reitschule'));

    await waitFor(() => expect(combobox().value).toBe('Reitschule'));
  });

  it('only asks for the caller‘s own organisations when told to', () => {
    renderPicker(true);

    expect(lastFilter()).toEqual({ mine: true });
  });

  it('asks for every organisation otherwise', () => {
    renderPicker();

    expect(lastFilter()).toEqual({});
  });

  it('searches on the server', async () => {
    renderPicker(true);

    combobox().focus();
    fireEvent.mouseDown(combobox());
    fireEvent.change(combobox(), { target: { value: 'reit' } });

    await waitFor(() =>
      expect(lastFilter()).toEqual({ mine: true, name: 'reit' })
    );
  });

  it('can be cleared again', async () => {
    renderPicker();

    fireEvent.mouseDown(combobox());
    fireEvent.click(await screen.findByText('Reitschule'));
    await waitFor(() => expect(combobox().value).toBe('Reitschule'));

    fireEvent.click(screen.getByTitle('Clear'));

    await waitFor(() => expect(combobox().value).toBe(''));
  });

  it('offers no way to clear it when clearing is not allowed', async () => {
    renderPicker(false, true);

    fireEvent.mouseDown(combobox());
    fireEvent.click(await screen.findByText('Reitschule'));
    await waitFor(() => expect(combobox().value).toBe('Reitschule'));

    expect(screen.queryByTitle('Clear')).not.toBeInTheDocument();
  });
});
