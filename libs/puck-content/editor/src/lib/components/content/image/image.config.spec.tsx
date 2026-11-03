import { PuckContext } from '@puckeditor/core';
import { screen } from '@testing-library/react';
import { mockImage, renderWithProviders } from '@wepublish/mocks/website';
import {
  emptyPuckBlockData,
  PuckBlockData,
} from '@wepublish/puck-content/website';
import { ComponentType, createElement } from 'react';

import { PuckBlockDataContext } from '../../../block-data/puck-block-data.context';
import { ImageConfig } from './image.config';

const puck: PuckContext = {
  renderDropZone: () => null,
  isEditing: true,
  dragRef: null,
  metadata: {},
};

const renderImage = (
  data: PuckBlockData = emptyPuckBlockData,
  props: Record<string, unknown> = {}
) =>
  renderWithProviders(
    <PuckBlockDataContext.Provider value={new Map([['Image-1', data]])}>
      {createElement(
        ImageConfig.render as ComponentType<Record<string, unknown>>,
        {
          ...ImageConfig.defaultProps,
          ...props,
          id: 'Image-1',
          puck,
        }
      )}
    </PuckBlockDataContext.Provider>
  );

describe('ImageConfig', () => {
  it('shows the image placeholder in the canvas while no image is set', () => {
    renderImage();

    expect(
      screen.getByRole('img', { name: 'No image selected' })
    ).toBeInTheDocument();
  });

  it('shows the image instead of the placeholder once one is set', () => {
    const image = mockImage({ description: 'Harbour at dawn' });

    renderImage({ ...emptyPuckBlockData, images: [image] });

    expect(
      screen.queryByRole('img', { name: 'No image selected' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Harbour at dawn' })
    ).toBeInTheDocument();
  });

  it('can hide the caption and the image credit', () => {
    expect(ImageConfig.fields?.hideCaption).toMatchObject({
      type: 'switch',
      label: 'Hide caption',
      ai: { instructions: expect.any(String) },
    });
    expect(ImageConfig.defaultProps?.hideCaption).toBe(false);
  });

  it('takes a ratio and object fit per breakpoint, original by default', () => {
    expect(ImageConfig.fields?.fit).toMatchObject({
      type: 'breakpoints',
      objectFields: {
        aspectRatio: { type: 'aspectRatio' },
        objectFit: { type: 'objectFit' },
      },
      ai: { schema: expect.any(Object) },
    });
    expect(ImageConfig.defaultProps?.fit).toEqual({
      xs: { aspectRatio: 'auto', objectFit: 'cover' },
    });
    expect(ImageConfig.ai?.instructions).toContain('hideCaption');
    expect(ImageConfig.ai?.instructions).toContain('fit');
  });

  it('hides the caption in the canvas as well', () => {
    const image = mockImage({
      description: 'Harbour at dawn',
      source: 'Keystone',
    });

    renderImage(
      { ...emptyPuckBlockData, images: [image] },
      { caption: 'Morning light', hideCaption: true }
    );

    expect(screen.queryByText('Morning light')).not.toBeInTheDocument();
    expect(screen.queryByText(/Keystone/)).not.toBeInTheDocument();
  });
});
