import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockOperation,
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FeaturesDocument } from '@wepublish/website/api';
import { z } from 'zod';

import { ProfileDetails } from './profile-details';

const renderWith = (features: string[]) =>
  renderWithProviders(<ProfileDetails />, {
    user: mockSensitiveDataUser(),
    mocks: [
      mockOperation(FeaturesDocument, {
        maxUsageCount: Number.POSITIVE_INFINITY,
        data: { __typename: 'Query', features },
      }),
    ],
  });

const section = (name: string) => screen.getByRole('region', { name });

describe('ProfileDetails', () => {
  describe('with the subscription history', () => {
    it('splits the profile into personal data and security', async () => {
      renderWith(['profile-subscription-history']);

      // the page prefetches the features; here they arrive after a render
      expect(
        await screen.findByRole('region', { name: 'Benutzerdaten' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: 'Profil' })
      ).toBeInTheDocument();
      expect(section('Sicherheit')).toBeInTheDocument();
    });

    it('changes the password under security, apart from the personal data', async () => {
      renderWith(['profile-subscription-history']);
      await screen.findByRole('region', { name: 'Sicherheit' });

      expect(
        within(section('Benutzerdaten')).queryByLabelText('Passwort')
      ).not.toBeInTheDocument();
      expect(
        within(section('Sicherheit')).getByRole('heading', {
          level: 3,
          name: 'Passwort ändern',
        })
      ).toBeInTheDocument();
      expect(
        within(section('Sicherheit')).getByLabelText('Passwort')
      ).toBeInTheDocument();
    });

    it('sets up two-factor authentication under security', async () => {
      renderWith(['profile-subscription-history']);
      await screen.findByRole('region', { name: 'Sicherheit' });

      expect(
        within(section('Sicherheit')).getByRole('heading', {
          level: 3,
          name: 'Zwei-Faktor-Authentifizierung',
        })
      ).toBeInTheDocument();
    });
  });

  // clearer than zod's generic messages, for now only with the history
  describe('the messages of the personal data', () => {
    // as on the website, where the global map has its catalog: in tests it
    // leaves its messages empty, which would hide that one overrides another
    const globalMap = z.getErrorMap();
    beforeEach(() => z.setErrorMap(() => ({ message: 'Globale Meldung' })));
    afterEach(() => z.setErrorMap(globalMap));

    const clearStreet = async () => {
      const user = userEvent.setup();
      const street = await screen.findByLabelText('Strasse');
      await user.clear(street);
      await user.tab();
    };

    it('calls an empty field empty with the subscription history', async () => {
      renderWith(['profile-subscription-history']);
      await screen.findByRole('region', { name: 'Benutzerdaten' });

      await clearStreet();

      await waitFor(() =>
        expect(screen.getByLabelText('Strasse')).toHaveAccessibleDescription(
          'Darf nicht leer sein'
        )
      );
    });

    it('keeps the global messages without it', async () => {
      renderWith([]);
      await screen.findByLabelText('Passwort');

      await clearStreet();

      expect(screen.getByLabelText('Strasse')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      await waitFor(() =>
        expect(screen.getByLabelText('Strasse')).toHaveAccessibleDescription(
          'Globale Meldung'
        )
      );
    });
  });

  it('keeps the single form otherwise', async () => {
    renderWith([]);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Profil' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Sicherheit' })
    ).not.toBeInTheDocument();
  });
});
