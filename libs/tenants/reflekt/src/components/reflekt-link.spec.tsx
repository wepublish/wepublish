import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  BuilderLinkProps,
  BuilderRouterContext,
} from '@wepublish/website/builder';
import { forwardRef } from 'react';

import { PRESS_DURATION_MS } from './hooks/use-press-animation';
import { withPressAnimation } from './reflekt-link';

const BaseLink = forwardRef<
  HTMLAnchorElement,
  BuilderLinkProps & { variant?: string }
>(function BaseLink({ children, href, variant, className, onClick }, ref) {
  return (
    <a
      ref={ref}
      href={href as string}
      className={className}
      data-variant={variant}
      onClick={onClick}
    >
      {children}
    </a>
  );
});

const Link = withPressAnimation(BaseLink);
const navigate = vi.fn(async () => undefined);

const renderLink = (variant?: string) =>
  render(
    <BuilderRouterContext.Provider value={{ query: {}, asPath: '/', navigate }}>
      <Link
        href="/mitmachen"
        variant={variant}
      >
        Mitmachen
      </Link>
    </BuilderRouterContext.Provider>
  );

describe('withPressAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigate.mockClear();
  });

  afterEach(() => vi.useRealTimers());

  it('renders the base link untouched for text variants', () => {
    renderLink('teaserTitleLink');

    const link = screen.getByRole('link', { name: 'Mitmachen' });
    fireEvent.click(link);

    expect(link).toHaveAttribute('href', '/mitmachen');
    expect(link).toHaveAttribute('data-variant', 'teaserTitleLink');
    expect(link).not.toHaveClass('is-pressing');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('presses a button link before navigating', () => {
    renderLink('buttonLinkMain');

    const link = screen.getByRole('link', { name: 'Mitmachen' });
    fireEvent.click(link);

    expect(link).toHaveClass('is-pressing');
    expect(navigate).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(PRESS_DURATION_MS));

    expect(link).not.toHaveClass('is-pressing');
    expect(navigate).toHaveBeenCalledWith('/mitmachen');
  });
});
