import { useQuery } from '@apollo/client/react';
import { screen } from '@testing-library/react';
import { TinyOrganizationListDocument } from '@wepublish/editor/api';
import { CanUpdateOtherOrganizationEvents } from '@wepublish/permissions';
import type { Mock } from 'vitest';

import { renderInForm } from '../test-helpers';
import { EventOrganizationField } from './event-organization-field';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const organizationFilter = () =>
  mockedUseQuery.mock.calls.find(
    ([document]) => document === TinyOrganizationListDocument
  )?.[1].variables.filter;

const dampfzentrale = { id: 'org-a', name: 'Dampfzentrale' };

const field = () =>
  screen.getByRole('combobox', { name: 'agenda.form.organization' });

beforeEach(() => {
  mockedUseQuery.mockReset().mockReturnValue({
    data: { organizations: { nodes: [], totalCount: 0 } },
  });
});

describe('EventOrganizationField', () => {
  describe('on a new event', () => {
    it('offers an organiser their own organisations only', () => {
      renderInForm(<EventOrganizationField isNew />);

      expect(field()).toBeEnabled();
      expect(organizationFilter()).toEqual({ mine: true });
      expect(
        screen.getByText('agenda.form.organizationHelpMine')
      ).toBeInTheDocument();
    });

    it('offers every organisation to a holder of the cross-organisation permission', () => {
      renderInForm(<EventOrganizationField isNew />, {
        permissions: [CanUpdateOtherOrganizationEvents.id],
      });

      expect(organizationFilter()).toEqual({});
    });
  });

  describe('on an existing event', () => {
    it('is locked with the reason when the caller may not move the event', () => {
      renderInForm(
        <EventOrganizationField
          isNew={false}
          viewerCan={{ moveOrganization: false, clearOrganization: false }}
        />
      );

      expect(field()).toBeDisabled();
      expect(
        screen.getByText('agenda.form.organizationLocked')
      ).toBeInTheDocument();
    });

    it('stays locked without a reason while the permissions load', () => {
      renderInForm(<EventOrganizationField isNew={false} />);

      expect(field()).toBeDisabled();
      expect(
        screen.queryByText('agenda.form.organizationLocked')
      ).not.toBeInTheDocument();
    });

    it('offers the caller’s own organisations when they may move it', () => {
      renderInForm(
        <EventOrganizationField
          isNew={false}
          viewerCan={{ moveOrganization: true, clearOrganization: true }}
        />
      );

      expect(field()).toBeEnabled();
      expect(organizationFilter()).toEqual({ mine: true });
    });

    it('keeps a member who does not own the event from leaving it without organisation', () => {
      renderInForm(
        <EventOrganizationField
          isNew={false}
          viewerCan={{ moveOrganization: true, clearOrganization: false }}
        />,
        { defaultValues: { organization: dampfzentrale } }
      );

      expect(field()).toBeEnabled();
      expect(screen.queryByTitle('Clear')).not.toBeInTheDocument();
      expect(
        screen.getByText('agenda.form.organizationKeep')
      ).toBeInTheDocument();
    });

    it('lets the caller clear the organisation when they keep the event without it', () => {
      renderInForm(
        <EventOrganizationField
          isNew={false}
          viewerCan={{ moveOrganization: true, clearOrganization: true }}
        />,
        { defaultValues: { organization: dampfzentrale } }
      );

      expect(screen.getByTitle('Clear')).toBeInTheDocument();
      expect(
        screen.getByText('agenda.form.organizationHelpMine')
      ).toBeInTheDocument();
    });
  });
});
