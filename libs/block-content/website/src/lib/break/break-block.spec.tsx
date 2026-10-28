import { screen } from '@testing-library/react';
import {
  mockBreakBlock,
  mockImage,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BreakBlock } from './break-block';

describe('BreakBlock', () => {
  it('shows image, text and rich text', () => {
    renderWithProviders(
      <BreakBlock
        {...mockBreakBlock({
          text: 'Support us',
          richText: mockRichTextParagraph('Independent journalism needs you.'),
          image: mockImage({ description: 'Newsroom' }),
        })}
      />
    );

    expect(screen.getByRole('img', { name: 'Newsroom' })).toBeInTheDocument();
    expect(screen.getByText('Support us')).toBeInTheDocument();
    expect(
      screen.getByText('Independent journalism needs you.')
    ).toBeInTheDocument();
  });

  it('shows the text without an image', () => {
    const { container } = renderWithProviders(
      <BreakBlock {...mockBreakBlock({ text: 'Support us', image: null })} />
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.getByText('Support us')).toBeInTheDocument();
  });

  it('hides the button when asked to', () => {
    renderWithProviders(
      <BreakBlock
        {...mockBreakBlock({ hideButton: true, linkText: 'Donate now' })}
      />
    );

    expect(
      screen.queryByRole('link', { name: 'Donate now' })
    ).not.toBeInTheDocument();
  });

  it('links the button to the target', () => {
    renderWithProviders(
      <BreakBlock
        {...mockBreakBlock({
          hideButton: false,
          linkText: 'Donate now',
          linkURL: 'https://example.com/donate',
          linkTarget: '_self',
        })}
      />
    );

    const link = screen.getByRole('link', { name: 'Donate now' });

    expect(link).toHaveAttribute('href', 'https://example.com/donate');
    expect(link).toHaveAttribute('target', '_self');
  });

  it('opens the link in a new tab when no target is set', () => {
    renderWithProviders(
      <BreakBlock
        {...mockBreakBlock({
          hideButton: false,
          linkText: 'Donate now',
          linkTarget: null,
        })}
      />
    );

    expect(screen.getByRole('link', { name: 'Donate now' })).toHaveAttribute(
      'target',
      '_blank'
    );
  });

  it('shows no button without link text', () => {
    renderWithProviders(
      <BreakBlock
        {...mockBreakBlock({
          hideButton: false,
          linkText: null,
          richText: mockRichTextParagraph('Independent journalism needs you.'),
        })}
      />
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
