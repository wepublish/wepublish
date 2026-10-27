import { screen, within } from '@testing-library/react';
import {
  mockOperation,
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FeaturesDocument } from '@wepublish/website/api';

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
