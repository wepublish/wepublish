import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';

import { H1, H2, H3, H4, H5, H6, Link, Paragraph } from './typography';

describe('Typography', () => {
  it('renders every heading at its own level', () => {
    renderWithProviders(
      <>
        <H1>H1</H1>
        <H2>H2</H2>
        <H3>H3</H3>
        <H4>H4</H4>
        <H5>H5</H5>
        <H6>H6</H6>
      </>
    );

    for (const level of [1, 2, 3, 4, 5, 6]) {
      expect(
        screen.getByRole('heading', { level, name: `H${level}` })
      ).toHaveClass(`MuiTypography-h${level}`);
    }
  });

  it('keeps the variant styling when rendered as a different element', () => {
    renderWithProviders(
      <>
        <H1 component="h6">Looks like H1</H1>
        <Paragraph component="strong">Strong paragraph</Paragraph>
      </>
    );

    const heading = screen.getByRole('heading', {
      level: 6,
      name: 'Looks like H1',
    });
    expect(heading).toHaveClass('MuiTypography-h1');

    const paragraph = screen.getByText('Strong paragraph');
    expect(paragraph.tagName).toBe('STRONG');
    expect(paragraph).toHaveClass('MuiTypography-body1');
  });

  it('gives paragraphs a bottom gutter unless turned off', () => {
    renderWithProviders(
      <>
        <Paragraph>With gutter</Paragraph>
        <Paragraph gutterBottom={false}>Without gutter</Paragraph>
      </>
    );

    expect(screen.getByText('With gutter')).toHaveClass(
      'MuiTypography-gutterBottom'
    );
    expect(screen.getByText('Without gutter')).not.toHaveClass(
      'MuiTypography-gutterBottom'
    );
  });

  it('renders links with their href', () => {
    renderWithProviders(<Link href="/about">About</Link>);

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about'
    );
  });
});
