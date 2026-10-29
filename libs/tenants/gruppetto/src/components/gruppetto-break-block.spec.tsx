import { screen } from '@testing-library/react';
import { mockBreakBlock, renderWithProviders } from '@wepublish/mocks/website';

import { gruppettoTenant } from '../gruppetto-tenant';
import theme from '../theme';
import { GruppettoBreakBlock } from './gruppetto-break-block';

const ancestorBackgrounds = (element: Element | null): string[] =>
  element ?
    [
      getComputedStyle(element).backgroundColor,
      ...ancestorBackgrounds(element.parentElement),
    ]
  : [];

describe('GruppettoBreakBlock', () => {
  it('highlights a break block with a button in pink', () => {
    renderWithProviders(
      <GruppettoBreakBlock
        {...mockBreakBlock({
          text: 'Werde Teil vom Gruppetto',
          image: null,
          hideButton: false,
          linkText: 'Jetzt Abo lösen',
          linkURL: 'https://gruppetto.ch/abo',
        })}
      />,
      { tenant: gruppettoTenant }
    );

    expect(
      screen.getByRole('link', { name: 'Jetzt Abo lösen' })
    ).toHaveAttribute('href', 'https://gruppetto.ch/abo');
    expect(
      ancestorBackgrounds(screen.getByText('Werde Teil vom Gruppetto'))
    ).toContain(theme.palette.primary.main);
  });

  it('keeps a break block without a button plain', () => {
    renderWithProviders(
      <GruppettoBreakBlock
        {...mockBreakBlock({
          text: 'Ohne Knopf',
          image: null,
          hideButton: true,
          linkText: 'Jetzt Abo lösen',
        })}
      />,
      { tenant: gruppettoTenant }
    );

    expect(
      screen.queryByRole('link', { name: 'Jetzt Abo lösen' })
    ).not.toBeInTheDocument();
    expect(ancestorBackgrounds(screen.getByText('Ohne Knopf'))).not.toContain(
      theme.palette.primary.main
    );
  });
});
