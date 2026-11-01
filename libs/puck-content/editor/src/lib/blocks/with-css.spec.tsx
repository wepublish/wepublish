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

const styleSheetText = () =>
  Array.from(document.styleSheets)
    .flatMap(sheet => Array.from(sheet.cssRules))
    .map(rule => rule.cssText)
    .join('\n');

describe('withCSS', () => {
  it('adds the styling field under the styling prop', () => {
    expect(Styled.fields).toHaveProperty('styling.type', 'styling');
    expect(Styled.fields).not.toHaveProperty('css');
  });

  it('limits the styling field and its AI schema to the given groups', () => {
    const Textless = withCSS<{ className?: string }>(
      { render: () => <div /> },
      { groups: ['background', 'spacing'] }
    );
    const field = Textless.fields?.styling as {
      groups?: string[];
      ai?: {
        schema?: {
          properties?: Record<string, { properties?: Record<string, unknown> }>;
        };
      };
    };
    const md = field.ai?.schema?.properties?.['md']?.properties;

    expect(field.groups).toEqual(['background', 'spacing']);
    expect(md).not.toHaveProperty('typography');
    expect(md).not.toHaveProperty('opacity');
    expect(md).toHaveProperty('background');
    expect(md).toHaveProperty('padding');
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
        styling: { xs: { color: '#ff0000' } },
      })
    );

    expect(received[0]).not.toHaveProperty('styling');
    expect(received[0]).toHaveProperty('className', expect.any(String));
  });

  it('styles the wrapped component', () => {
    renderStyled({ xs: { color: '#ff0000', opacity: 50 } });

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
      { xs: { backgroundImage: 'image-1', backgroundSize: 'contain' } },
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

  it('styles each breakpoint inside its media query', () => {
    renderStyled({ xs: { opacity: 50 }, md: { opacity: 80 } });

    expect(screen.getByTestId('styled')).toHaveStyle({ opacity: '0.8' });
    expect(styleSheetText()).toMatch(/opacity:\s?0\.5/);
    expect(styleSheetText()).toMatch(
      /@media \(min-width:\s?900px\)\s?\{[^}]*opacity:\s?0\.8/
    );
  });

  it('resolves the background image of every breakpoint', async () => {
    renderStyled(
      {
        xs: { backgroundImage: 'image-1' },
        md: { backgroundImage: 'image-2' },
      },
      {
        mocks: [
          mockOperation(ImageDocument, {
            variables: { id: 'image-1' },
            data: {
              __typename: 'Query',
              image: mockImage({
                id: 'image-1',
                xxl: 'https://example.com/small.webp',
              }),
            },
          }),
          mockOperation(ImageDocument, {
            variables: { id: 'image-2' },
            data: {
              __typename: 'Query',
              image: mockImage({
                id: 'image-2',
                xxl: 'https://example.com/large.webp',
              }),
            },
          }),
        ],
      }
    );

    await waitFor(() => {
      expect(styleSheetText()).toContain('https://example.com/small.webp');
      expect(screen.getByTestId('styled')).toHaveStyle({
        backgroundImage: 'url("https://example.com/large.webp")',
      });
    });
  });
});
