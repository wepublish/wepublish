import { screen } from '@testing-library/react';
import { mockImage, renderWithProviders } from '@wepublish/mocks/website';
import { BuilderImageProps } from '@wepublish/website/builder';
import { Image } from './image';
import { ImageContext } from './image.context';

const image = mockImage({ title: 'Title', description: 'Description' });

const renderImage = (props: Partial<BuilderImageProps> = {}) =>
  renderWithProviders(
    <Image
      image={image}
      {...props}
    />
  );

const srcSetOf = (img: HTMLElement) =>
  (img.getAttribute('srcset') ?? '').split(',\n');

describe('Image', () => {
  it('uses the description as alt text and the title as title', () => {
    renderImage();

    expect(screen.getByRole('img', { name: 'Description' })).toHaveAttribute(
      'title',
      'Title'
    );
  });

  it('falls back to the title as alt text', () => {
    renderImage({ image: { ...image, description: null } });

    expect(screen.getByRole('img', { name: 'Title' })).toBeInTheDocument();
  });

  it('has an empty alt text and title without description and title', () => {
    const { container } = renderImage({
      image: { ...image, description: null, title: null },
    });

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('title', '');
  });

  it('offers the sizes up to 1200px by default, lazily loaded with low priority', () => {
    renderImage();

    const img = screen.getByRole('img');

    expect(srcSetOf(img)).toEqual([
      `${image.xl} 1200w`,
      `${image.l} 1000w`,
      `${image.m} 800w`,
      `${image.s} 500w`,
      `${image.xs} 300w`,
      `${image.xxs} 200w`,
    ]);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('fetchpriority', 'low');
    expect(img).toHaveAttribute('width', String(image.width));
    expect(img).toHaveAttribute('height', String(image.height));
  });

  it('describes which size to pick for which viewport', () => {
    renderImage();

    expect(screen.getByRole('img').getAttribute('sizes')?.split(',\n')).toEqual(
      [
        '(max-width: 400px) 200w',
        '(max-width: 600px) 300w',
        '(max-width: 1000px) 500w',
        '(max-width: 1600px) 800w',
        '(max-width: 2000px) 1000w',
        '(max-width: 2400px) 1200w',
        '(max-width: 3000px) 1500w',
        '2400w',
      ]
    );
  });

  it('only offers sizes up to the max width', () => {
    renderImage({ maxWidth: 200 });

    expect(screen.getByRole('img')).toHaveAttribute(
      'srcset',
      `${image.xxs} 200w`
    );
  });

  it('offers every size with a large max width', () => {
    renderImage({ maxWidth: 2400 });

    expect(srcSetOf(screen.getByRole('img'))).toEqual(
      expect.arrayContaining([`${image.xxxl} 2400w`, `${image.xxl} 1500w`])
    );
  });

  it('skips sizes without url', () => {
    renderImage({ image: { ...image, l: null, m: null } });

    expect(srcSetOf(screen.getByRole('img'))).toEqual([
      `${image.xl} 1200w`,
      `${image.s} 500w`,
      `${image.xs} 300w`,
      `${image.xxs} 200w`,
    ]);
  });

  it('uses the square crops without fixed dimensions', () => {
    renderImage({ square: true, maxWidth: 500 });

    const img = screen.getByRole('img');

    expect(srcSetOf(img)).toEqual([
      `${image.sSquare} 500w`,
      `${image.xsSquare} 300w`,
      `${image.xxsSquare} 200w`,
    ]);
    expect(img).not.toHaveAttribute('width');
    expect(img).not.toHaveAttribute('height');
  });

  it('loads eagerly with high priority when asked to', () => {
    renderImage({ loading: 'eager', fetchPriority: 'high' });

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('lets the image context override the props', () => {
    renderWithProviders(
      <ImageContext.Provider value={{ maxWidth: 200, loading: 'eager' }}>
        <Image
          image={image}
          maxWidth={1200}
        />
      </ImageContext.Provider>
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('srcset', `${image.xxs} 200w`);
    expect(img).toHaveAttribute('loading', 'eager');
  });
});
