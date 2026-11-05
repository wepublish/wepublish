import { screen } from '@testing-library/react';
import { mockNavigations, renderWithProviders } from '@wepublish/mocks/website';

import { FactuelFooter } from './factuel-footer';

const renderFooter = () =>
  renderWithProviders(
    <FactuelFooter
      data={{ __typename: 'Query', navigations: mockNavigations() }}
      loading={false}
      slug="main"
      categorySlugs={[['categories', 'about']]}
      iconSlug="icons"
      wepublishLogo="light"
    />
  );

describe('FactuelFooter', () => {
  it('shows who publishes courant and how to reach them', () => {
    renderFooter();

    expect(screen.getByText('courant.ch')).toBeInTheDocument();
    expect(
      screen.getByText('Association Pour un nouveau journalisme genevois')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'contact@courant.ch' })
    ).toHaveAttribute('href', 'mailto:contact@courant.ch');
  });

  it('keeps the category navigation next to the contact', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'Mobilität' })).toHaveAttribute(
      'href',
      '/mobilitaet'
    );
    expect(screen.getByRole('link', { name: 'Team' })).toHaveAttribute(
      'href',
      '/team'
    );
  });
});
