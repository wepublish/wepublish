import { useQuery } from '@apollo/client/react';
import { fireEvent, screen, within } from '@testing-library/react';
import type { Mock } from 'vitest';

import { formValues, renderInForm } from '../test-helpers';
import { EventAudienceField } from './event-audience-field';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

beforeEach(() => {
  (useQuery as unknown as Mock).mockReturnValue({
    data: {
      eventAudiences: [
        { __typename: 'EventAudience', id: 'aud-1', name: 'Für alle' },
        { __typename: 'EventAudience', id: 'aud-2', name: 'Für Kinder' },
      ],
    },
  });
});

describe('EventAudienceField', () => {
  it('offers the audiences and an explicit “not specified”, stored as null', () => {
    renderInForm(<EventAudienceField />, {
      defaultValues: { audienceId: 'aud-1' },
    });

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'agenda.form.audience' })
    );

    const listbox = screen.getByRole('listbox');

    expect(
      within(listbox)
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual(['agenda.form.audienceNone', 'Für alle', 'Für Kinder']);

    fireEvent.click(
      within(listbox).getByRole('option', { name: 'agenda.form.audienceNone' })
    );

    expect(formValues().audienceId).toBeNull();
  });
});
