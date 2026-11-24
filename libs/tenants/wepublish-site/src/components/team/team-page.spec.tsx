import { screen, within } from '@testing-library/react';
import {
  applyTenantTranslations,
  mockAuthor,
  mockAuthorLink,
  mockImage,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';

import { wepublishSiteTenant } from '../../wepublish-site-tenant';
import { WepTeamPage } from './team-page';

const ramona = mockAuthor({
  name: 'Ramona Sprenger',
  jobTitle: 'Co-Geschäftsführerin',
  url: 'https://wepublish.ch/author/ramona-sprenger',
  image: mockImage({ title: 'Porträt Ramona Sprenger' }),
  links: [
    mockAuthorLink({ title: 'LinkedIn', url: 'https://linkedin.com/in/rs' }),
    mockAuthorLink({ title: 'E-Mail', url: 'mailto:ramona@wepublish.ch' }),
  ],
});

const karl = mockAuthor({
  name: 'Karl Merkli',
  jobTitle: 'Senior Developer',
  url: 'https://wepublish.ch/author/karl-merkli',
  links: [mockAuthorLink({ title: 'Website', url: 'https://karl.ch' })],
});

const hidden = mockAuthor({ name: 'Nicht im Team', hideOnTeam: true });

const renderTeam = () =>
  renderWithProviders(<WepTeamPage authors={[ramona, karl, hidden]} />, {
    tenant: wepublishSiteTenant,
    router: { locale: 'de' },
  });

const person = (name: string) => screen.getByRole('article', { name });

describe('team page', () => {
  beforeAll(() => applyTenantTranslations(wepublishSiteTenant));
  afterAll(() => resetTranslations());

  it('opens with the pre-title, the title and the lead', () => {
    renderTeam();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Team' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Die Menschen hinter We.Publish')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'We.Publish wird von einem interdisziplinären Team mit langjähriger Erfahrung in Journalismus, Technologie, Design und Organisationsentwicklung getragen.'
      )
    ).toBeInTheDocument();
  });

  it('shows every person of the team with portrait, name and job title', () => {
    renderTeam();

    expect(
      screen.getAllByRole('article').map(article => article.textContent)
    ).toEqual([
      expect.stringContaining('Ramona Sprenger'),
      expect.stringContaining('Karl Merkli'),
    ]);
    expect(
      within(person('Ramona Sprenger')).getByRole('img', {
        name: 'Porträt Ramona Sprenger',
      })
    ).toBeInTheDocument();
    expect(
      within(person('Ramona Sprenger')).getByText('Co-Geschäftsführerin')
    ).toBeInTheDocument();
  });

  it('links the name to the page of the person', () => {
    renderTeam();

    expect(
      within(person('Karl Merkli')).getByRole('link', { name: 'Karl Merkli' })
    ).toHaveAttribute('href', 'https://wepublish.ch/author/karl-merkli');
  });

  it('shows the e-mail address of a person as button', () => {
    renderTeam();

    expect(
      within(person('Ramona Sprenger')).getByRole('link', {
        name: 'ramona@wepublish.ch',
      })
    ).toHaveAttribute('href', 'mailto:ramona@wepublish.ch');
    expect(
      within(person('Ramona Sprenger')).queryByRole('link', {
        name: 'LinkedIn',
      })
    ).not.toBeInTheDocument();
  });

  it('leaves out the button without an e-mail address', () => {
    renderTeam();

    expect(within(person('Karl Merkli')).getAllByRole('link')).toHaveLength(1);
  });
});
