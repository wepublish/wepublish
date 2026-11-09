import { screen } from '@testing-library/react';
import { mockNavigations, renderWithProviders } from '@wepublish/mocks/website';

import { CourantFooter } from './courant-footer';

const renderFooter = () =>
  renderWithProviders(
    <CourantFooter
      data={{ __typename: 'Query', navigations: mockNavigations() }}
      loading={false}
      slug="main"
      categorySlugs={[['categories', 'about']]}
      iconSlug="icons"
      wepublishLogo="light"
    />
  );

describe('CourantFooter', () => {
  it('shows the Courant wordmark and tagline', () => {
    renderFooter();

    expect(screen.getByRole('img', { name: 'Courant' })).toBeInTheDocument();
    expect(
      screen.getByText('Votre nouveau média genevois')
    ).toBeInTheDocument();
  });

  it('keeps the category navigation', () => {
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
