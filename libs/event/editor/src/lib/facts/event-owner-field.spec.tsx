import { useQuery } from '@apollo/client/react';
import { fireEvent, screen } from '@testing-library/react';
import { UserListDocument } from '@wepublish/editor/api';
import { CanUpdateOtherOrganizationEvents } from '@wepublish/permissions';
import type { Mock } from 'vitest';

import { formValues, renderInForm } from '../test-helpers';
import { EventOwnerField } from './event-owner-field';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const CROSS_ORGANIZATION = [CanUpdateOtherOrganizationEvents.id];

const usersQueried = () =>
  mockedUseQuery.mock.calls.some(
    ([document, options]) => document === UserListDocument && !options?.skip
  );

beforeEach(() => {
  mockedUseQuery.mockReset().mockReturnValue({
    data: {
      users: {
        nodes: [
          {
            __typename: 'SensitiveDataUser',
            id: 'user-2',
            name: 'Muster',
            firstName: 'Anna',
            email: 'anna@example.com',
          },
        ],
        totalCount: 1,
      },
    },
  });
});

describe('EventOwnerField', () => {
  describe('on a new event', () => {
    it('shows the caller as owner, read-only, and looks up no users', () => {
      renderInForm(<EventOwnerField isNew />);

      const owner = screen.getByRole('textbox', { name: 'agenda.form.owner' });

      expect(owner).toHaveValue('agenda.form.ownerYou');
      expect(owner).toHaveAttribute('readonly');
      expect(usersQueried()).toBe(false);
    });

    it('lets a holder of the cross-organisation permission name another owner', () => {
      renderInForm(<EventOwnerField isNew />, {
        permissions: CROSS_ORGANIZATION,
      });

      fireEvent.mouseDown(
        screen.getByRole('combobox', { name: 'agenda.form.owner' })
      );
      fireEvent.click(screen.getByRole('option', { name: /Anna Muster/ }));

      expect(usersQueried()).toBe(true);
      expect(formValues().owner).toEqual({
        id: 'user-2',
        name: 'Anna Muster',
      });
    });
  });

  describe('on an existing event', () => {
    it('shows the owner read-only with the reason when the caller may not reassign it', () => {
      renderInForm(
        <EventOwnerField
          isNew={false}
          viewerCan={{ reassignOwner: false }}
        />,
        { defaultValues: { owner: { id: 'user-1', name: 'Lea Keller' } } }
      );

      expect(
        screen.getByRole('textbox', { name: 'agenda.form.owner' })
      ).toHaveValue('Lea Keller');
      expect(screen.getByText('agenda.form.ownerLocked')).toBeInTheDocument();
      expect(usersQueried()).toBe(false);
    });

    it('says when the event has no owner', () => {
      renderInForm(
        <EventOwnerField
          isNew={false}
          viewerCan={{ reassignOwner: false }}
        />
      );

      expect(
        screen.getByRole('textbox', { name: 'agenda.form.owner' })
      ).toHaveValue('agenda.form.ownerNone');
    });

    it('offers a user picker when the caller may reassign it', () => {
      renderInForm(
        <EventOwnerField
          isNew={false}
          viewerCan={{ reassignOwner: true }}
        />,
        { permissions: CROSS_ORGANIZATION }
      );

      expect(
        screen.getByRole('combobox', { name: 'agenda.form.owner' })
      ).toBeEnabled();
      expect(usersQueried()).toBe(true);
    });
  });
});
