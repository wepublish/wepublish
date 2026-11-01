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

const renderImage = (data: PuckBlockData = emptyPuckBlockData) =>
  renderWithProviders(
    <PuckBlockDataContext.Provider value={new Map([['Image-1', data]])}>
      {createElement(
        ImageConfig.render as ComponentType<Record<string, unknown>>,
        {
          ...ImageConfig.defaultProps,
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
});
