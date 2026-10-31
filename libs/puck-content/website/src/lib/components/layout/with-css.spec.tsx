import { PuckContext } from '@puckeditor/core';
import { screen, waitFor } from '@testing-library/react';
import {
  mockImage,
  mockOperation,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { ImageDocument } from '@wepublish/website/api';
import { createElement } from 'react';

import { CSSValue, withCSS } from './with-css';

const puck: PuckContext = {
  renderDropZone: () => null,
  isEditing: false,
  dragRef: null,
  metadata: {},
};

const Styled = withCSS<{ className?: string }>({
  render: ({ className }) => (
    <div
      data-testid="styled"
      className={className}
    />
  ),
});

const renderStyled = (
  styling: CSSValue,
  options: Parameters<typeof renderWithProviders>[1] = {}
) =>
  renderWithProviders(
    createElement(Styled.render, { id: 'Styled-1', puck, styling }),
    options
  );

describe('withCSS', () => {
  it('adds the styling field under the styling prop', () => {
    expect(Styled.fields).toHaveProperty('styling.type', 'styling');
    expect(Styled.fields).not.toHaveProperty('css');
  });

  it('keeps the styling prop away from the wrapped component', () => {
    const received: unknown[] = [];
    const Wrapped = withCSS<{ className?: string }>({
      render: props => {
        received.push(props);

        return <span />;
      },
    });

    renderWithProviders(
      createElement(Wrapped.render, {
        id: 'Wrapped-1',
        puck,
        styling: { color: '#ff0000' },
      })
    );

    expect(received[0]).not.toHaveProperty('styling');
    expect(received[0]).toHaveProperty('className', expect.any(String));
  });

  it('styles the wrapped component', () => {
    renderStyled({ color: '#ff0000', opacity: 50 });

    expect(screen.getByTestId('styled')).toHaveStyle({
      color: '#ff0000',
      opacity: '0.5',
    });
  });

  it('resolves the background image url from the image id', async () => {
    const image = mockImage({
      id: 'image-1',
      xxl: 'https://example.com/image-xxl.webp',
    });

    renderStyled(
      { backgroundImage: 'image-1', backgroundSize: 'contain' },
      {
        mocks: [
          mockOperation(ImageDocument, {
            variables: { id: 'image-1' },
            data: { __typename: 'Query', image },
          }),
        ],
      }
    );

    await waitFor(() =>
      expect(screen.getByTestId('styled')).toHaveStyle({
        backgroundImage: 'url("https://example.com/image-xxl.webp")',
        backgroundSize: 'contain',
      })
    );
  });
});
