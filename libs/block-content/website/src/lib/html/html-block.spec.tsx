import { screen } from '@testing-library/react';
import { mockHTMLBlock, renderWithProviders } from '@wepublish/mocks/website';
import { HtmlBlock } from './html-block';

describe('HtmlBlock', () => {
  it('renders the html markup', () => {
    renderWithProviders(
      <HtmlBlock
        {...mockHTMLBlock({ html: '<p><strong>Live</strong> results</p>' })}
      />
    );

    expect(screen.getByText('Live').tagName).toBe('STRONG');
    expect(screen.getByText('results', { exact: false })).toBeInTheDocument();
  });

  it('replaces the markup when the html changes', () => {
    const { rerender } = renderWithProviders(
      <HtmlBlock {...mockHTMLBlock({ html: '<p>Before</p>' })} />
    );

    rerender(<HtmlBlock {...mockHTMLBlock({ html: '<p>After</p>' })} />);

    expect(screen.queryByText('Before')).not.toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('renders an empty wrapper without html', () => {
    const { container } = renderWithProviders(
      <HtmlBlock
        {...mockHTMLBlock({ html: '' })}
        className="html"
      />
    );

    expect(container.querySelector('.html')).toBeEmptyDOMElement();
  });
});
