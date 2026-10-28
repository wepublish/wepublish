import { screen } from '@testing-library/react';
import {
  mockInstagramPostBlock,
  renderWithProviders,
  TEST_SCRIPT_TEST_ID,
} from '@wepublish/mocks/website';
import { InstagramPostBlock } from './instagram-post-block';

describe('InstagramPostBlock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the captioned post placeholder and loads the Instagram embed script', () => {
    const { container } = renderWithProviders(
      <InstagramPostBlock
        {...mockInstagramPostBlock({ postID: 'CvACOxxIqT2' })}
      />
    );

    const post = container.querySelector('blockquote.instagram-media');

    expect(post).toHaveAttribute(
      'data-instgrm-permalink',
      'https://www.instagram.com/p/CvACOxxIqT2/'
    );
    expect(post).toHaveAttribute('data-instgrm-captioned');
    expect(screen.getByTestId(TEST_SCRIPT_TEST_ID)).toHaveAttribute(
      'data-src',
      'https://www.instagram.com/embed.js'
    );
  });

  it('encodes the post id in the permalink', () => {
    const { container } = renderWithProviders(
      <InstagramPostBlock {...mockInstagramPostBlock({ postID: 'a/b?c' })} />
    );

    expect(
      container.querySelector('blockquote.instagram-media')
    ).toHaveAttribute(
      'data-instgrm-permalink',
      'https://www.instagram.com/p/a%2Fb%3Fc/'
    );
  });

  it('asks an already loaded Instagram script to process the new post', () => {
    const process = vi.fn();
    vi.stubGlobal('instgrm', { Embeds: { process } });

    renderWithProviders(<InstagramPostBlock {...mockInstagramPostBlock()} />);

    expect(process).toHaveBeenCalledTimes(1);
  });

  it('still renders the post when the Instagram script fails to process it', () => {
    vi.stubGlobal('instgrm', {
      Embeds: {
        process: () => {
          throw new Error('blocked');
        },
      },
    });

    const { container } = renderWithProviders(
      <InstagramPostBlock {...mockInstagramPostBlock()} />
    );

    expect(
      container.querySelector('blockquote.instagram-media')
    ).not.toBeNull();
  });

  it('renders nothing without a post id', () => {
    const { container } = renderWithProviders(
      <InstagramPostBlock {...mockInstagramPostBlock({ postID: null })} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
