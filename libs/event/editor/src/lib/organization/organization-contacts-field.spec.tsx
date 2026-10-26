import { fireEvent, screen } from '@testing-library/react';

import { OrganizationContactsField } from './organization-contacts-field';
import { organizationValues, renderInOrganizationForm } from './test-helpers';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

const contact = (index: number) => ({
  id: `c${index}`,
  value: { label: '', email: '', phone: `031 00${index}` },
});

describe('OrganizationContactsField', () => {
  it('adds a contact with labelled label, email and phone fields', () => {
    renderInOrganizationForm(<OrganizationContactsField />);

    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.organizations.contacts.add' })
    );
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'agenda.organizations.contacts.email 1',
      }),
      { target: { value: 'kasse@equilibre.ch' } }
    );
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'agenda.organizations.contacts.label 1',
      }),
      { target: { value: 'Kasse' } }
    );

    expect(organizationValues().contacts.map(({ value }) => value)).toEqual([
      { label: 'Kasse', email: 'kasse@equilibre.ch', phone: '' },
    ]);
  });

  it('stops offering Add at six contacts and says why', () => {
    renderInOrganizationForm(<OrganizationContactsField />, {
      defaultValues: { contacts: [1, 2, 3, 4, 5, 6].map(contact) },
    });

    expect(
      screen.queryByRole('button', {
        name: 'agenda.organizations.contacts.add',
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('agenda.organizations.contacts.atMax 6')
    ).toBeInTheDocument();
  });

  it('shows at the row that a contact needs an email or a phone number', async () => {
    renderInOrganizationForm(<OrganizationContactsField />, {
      defaultValues: {
        name: 'Equilibre',
        contacts: [
          { id: 'c', value: { label: 'Kasse', email: '', phone: '' } },
        ],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    expect(
      await screen.findByText(
        'agenda.organizations.errors.contactNeedsEmailOrPhone'
      )
    ).toBeInTheDocument();
  });
});
