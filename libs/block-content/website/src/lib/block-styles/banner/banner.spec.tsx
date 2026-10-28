import { screen } from '@testing-library/react';
import {
  mockBreakBlock,
  mockImage,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullBreakBlockFragment } from '@wepublish/website/api';
import { BlockRenderer } from '../../blocks';

const renderBanner = (overrides: Partial<FullBreakBlockFragment> = {}) =>
  renderWithProviders(
    <BlockRenderer
      block={mockBreakBlock({ blockStyle: 'Banner', ...overrides })}
      index={0}
      count={1}
      type="Article"
    />
  );

describe('Banner block style', () => {
  it('renders the break block image as a link to its url', () => {
    renderBanner({
      image: mockImage({ description: 'Banner image' }),
      linkURL: 'https://example.com/campaign',
      linkTarget: '_self',
    });

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', 'https://example.com/campaign');
    expect(link).toHaveAttribute('target', '_self');
    expect(
      screen.getByRole('img', { name: 'Banner image' })
    ).toBeInTheDocument();
  });

  it('opens in a new tab when no target is set', () => {
    renderBanner({ linkTarget: null });

    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });

  it('shows only the image, not the break block text or button', () => {
    renderBanner({ text: 'Break title', hideButton: false });

    expect(screen.queryByText('Break title')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an empty link when there is no image', () => {
    const { container } = renderBanner({ image: null });

    expect(screen.getByRole('link')).toBeEmptyDOMElement();
    expect(container.querySelector('img')).toBeNull();
  });
});
