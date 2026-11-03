import { screen } from '@testing-library/react';
import { mockImage, renderWithProviders } from '@wepublish/mocks/website';
import type { BuilderBlockStyleProps } from '@wepublish/website/builder';
import { createElement } from 'react';

import { emptyPuckBlockData, PuckBlockData } from '../../../blocks/block.types';
import { LightboxRender } from './lightbox.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

type LightboxProps = BuilderBlockStyleProps['Lightbox'];

const received: LightboxProps[] = [];

const LightboxProbe = (props: LightboxProps) => {
  received.push(props);

  return (
    <ul
      aria-label="Gallery"
      className={props.className}
    >
      {props.images.map((image, index) => (
        <li key={index}>{image.caption}</li>
      ))}
    </ul>
  );
};

const lastReceived = () => received[received.length - 1];

const lake = mockImage({ id: 'lake' });
const summit = mockImage({ id: 'summit' });

const renderLightbox = (
  data: PuckBlockData = emptyPuckBlockData,
  extra: Partial<Parameters<typeof LightboxRender>[0]> = {}
) =>
  renderWithProviders(
    createElement(LightboxRender, {
      id: 'Lightbox-1',
      props: {
        images: [
          { imageId: 'summit', caption: 'The summit' },
          { imageId: 'lake' },
          { imageId: 'deleted', caption: 'Gone' },
          {},
        ],
      },
      data,
      slots: {},
      className: 'styled-block',
      ...extra,
    }),
    { builder: { blockStyles: { Lightbox: LightboxProbe } } }
  );

beforeEach(() => {
  received.length = 0;
});

describe('LightboxRender', () => {
  it('hands every stored image to the gallery in order, matched by id', () => {
    renderLightbox({ ...emptyPuckBlockData, images: [lake, summit] });

    expect(lastReceived().images).toEqual([
      { __typename: 'ImageGalleryImage', caption: 'The summit', image: summit },
      { __typename: 'ImageGalleryImage', caption: null, image: lake },
      { __typename: 'ImageGalleryImage', caption: 'Gone', image: null },
      { __typename: 'ImageGalleryImage', caption: null, image: null },
    ]);
  });

  it('keeps the slots of images the data does not hold yet', () => {
    renderLightbox();

    expect(lastReceived().images.map(({ image }) => image)).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });

  it('puts the class name on its single root element', () => {
    const { container } = renderLightbox();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(
      screen.getByRole('list', { name: 'Gallery' })
    );
    expect(container.firstElementChild).toHaveClass('styled-block');
  });

  it('passes the overlay refs of the editor on and none on the website', () => {
    const refs = { fullscreen: vi.fn(), prev: vi.fn(), next: vi.fn() };

    renderLightbox(emptyPuckBlockData, { refs });

    expect(lastReceived().refs).toBe(refs);

    renderLightbox();

    expect(lastReceived().refs).toBeUndefined();
  });

  it('drops the captions and image credits when captions are hidden', () => {
    const credited = mockImage({ id: 'summit', source: 'Keystone' });

    renderLightbox(
      { ...emptyPuckBlockData, images: [lake, credited] },
      {
        props: {
          images: [{ imageId: 'summit', caption: 'The summit' }],
          hideCaption: true,
        },
      }
    );

    expect(lastReceived().images).toEqual([
      {
        __typename: 'ImageGalleryImage',
        caption: null,
        image: { ...credited, source: null },
      },
    ]);
  });

  it('crops the gallery images to the chosen ratio', () => {
    const { container } = renderWithProviders(
      createElement(LightboxRender, {
        id: 'Lightbox-1',
        props: {
          images: [{ imageId: 'summit' }],
          fit: { xs: { aspectRatio: '4:3', objectFit: 'contain' } },
        },
        data: { ...emptyPuckBlockData, images: [summit] },
        slots: {},
      })
    );

    expect(container.querySelector('img')).toHaveStyle({
      width: '100%',
      objectFit: 'contain',
    });
  });
});
