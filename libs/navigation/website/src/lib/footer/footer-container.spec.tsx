import { screen } from '@testing-library/react';
import {
  mockNavigations,
  mockOperation,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { NavigationListDocument } from '@wepublish/website/api';
import { FooterContainer } from './footer-container';

describe('FooterContainer', () => {
  it('shows the navigations from the API and the children', async () => {
    renderWithProviders(
      <FooterContainer
        slug="main"
        categorySlugs={[['categories'], ['about']]}
      >
        <p>Impressum</p>
      </FooterContainer>,
      {
        mocks: [
          mockOperation(NavigationListDocument, {
            variables: {},
            data: { __typename: 'Query', navigations: mockNavigations() },
          }),
        ],
      }
    );

    expect(
      await screen.findByRole('link', { name: 'Gesellschaft' })
    ).toHaveAttribute('href', '/gesellschaft');
    expect(screen.getByText('Kategorien')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jobs' })).toHaveAttribute(
      'href',
      '/jobs'
    );
    expect(screen.getByText('Impressum')).toBeInTheDocument();
  });

  it('shows the light We.Publish logo by default', async () => {
    const { container } = renderWithProviders(
      <FooterContainer
        slug="main"
        categorySlugs={[]}
      />,
      {
        mocks: [
          mockOperation(NavigationListDocument, {
            variables: {},
            data: { __typename: 'Query', navigations: mockNavigations() },
          }),
        ],
      }
    );

    await screen.findByRole('link', { name: 'Gesellschaft' });

    expect(
      container.querySelector(
        'a[href="https://wepublish.ch/de/das-projekt/#cms"] path[fill="black"]'
      )
    ).toBeInTheDocument();
  });
});
