import { renderWithProviders } from '@wepublish/mocks/website';
import { createElement, createRef } from 'react';

import { emptyPuckBlockData } from '../../../blocks/block.types';
import { SpaceRender } from './space.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const renderSpace = (extra: Partial<Parameters<typeof SpaceRender>[0]> = {}) =>
  renderWithProviders(
    createElement(SpaceRender, {
      id: 'Space-1',
      props: { size: { xs: { size: 24 } } },
      data: emptyPuckBlockData,
      slots: {},
      className: 'styled',
      ...extra,
    })
  );

describe('SpaceRender', () => {
  it('renders one element of the stored height that carries the class name', () => {
    const { container } = renderSpace();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled');
    expect(container.firstElementChild).toHaveStyle({ height: '24px' });
  });

  it('puts the ref on its element', () => {
    const ref = createRef<HTMLElement>();
    const { container } = renderSpace({ ref });

    expect(ref.current).toBe(container.firstElementChild);
  });
});
