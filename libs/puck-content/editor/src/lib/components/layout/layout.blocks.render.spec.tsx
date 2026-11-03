import { PuckContext, SlotComponent } from '@puckeditor/core';
import { renderWithProviders } from '@wepublish/mocks/website';
import { ComponentType, createElement, PropsWithChildren } from 'react';

import { layoutComponents } from './layout.blocks';

vi.mock('@wepublish/block-content/website', async importOriginal => ({
  ...(await importOriginal<
    typeof import('@wepublish/block-content/website')
  >()),
  Slider: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

type LayoutType = keyof typeof layoutComponents;

const puck = (overrides: Partial<PuckContext> = {}): PuckContext => ({
  renderDropZone: () => null,
  isEditing: true,
  dragRef: null,
  metadata: {},
  ...overrides,
});

const puckSlot = () =>
  vi.fn<SlotComponent>(props => (
    <div
      data-testid="slot"
      className={props?.className}
    />
  ));

const renderBlock = (type: LayoutType, props: Record<string, unknown>) =>
  renderWithProviders(
    createElement(
      layoutComponents[type].render as ComponentType<Record<string, unknown>>,
      {
        ...layoutComponents[type].defaultProps,
        id: `${type}-1`,
        puck: puck(),
        ...props,
      }
    )
  );

describe('layout blocks in the editor', () => {
  it.each([
    ['Grid', 300],
    ['Container', 300],
    ['Row', 100],
    ['Collapsible', 120],
  ] as const)(
    '%s keeps its empty slot %ipx high so blocks can be dropped in',
    (type, minEmptyHeight) => {
      const content = puckSlot();

      renderBlock(type, { content });

      expect(content).toHaveBeenCalledWith(
        expect.objectContaining({ minEmptyHeight })
      );
    }
  );

  it.each([
    ['DynamicGrid', 100],
    ['Slider', 200],
  ] as const)(
    '%s keeps every empty item slot %ipx high',
    (type, minEmptyHeight) => {
      const first = puckSlot();
      const second = puckSlot();

      renderBlock(type, { items: [{ content: first }, { content: second }] });

      expect(first).toHaveBeenCalledWith(
        expect.objectContaining({ minEmptyHeight })
      );
      expect(second).toHaveBeenCalledWith(
        expect.objectContaining({ minEmptyHeight })
      );
    }
  );

  it('drags a space by its own element', () => {
    const dragRef = vi.fn();

    const { container } = renderWithProviders(
      createElement(
        layoutComponents.Space.render as ComponentType<Record<string, unknown>>,
        {
          ...layoutComponents.Space.defaultProps,
          id: 'Space-1',
          puck: puck({ dragRef }),
        }
      )
    );

    expect(layoutComponents.Space.inline).toBe(true);
    expect(dragRef).toHaveBeenCalledWith(container.firstElementChild);
  });

  it.each(['Grid', 'Row', 'Container'] as const)(
    '%s keeps the block envelope away from its slot and the DOM',
    type => {
      const content = puckSlot();

      const { container } = renderBlock(type, {
        content,
        datasources: { article: { type: 'list' } },
        locked: true,
      });

      expect(
        content.mock.calls.every(([props]) =>
          Object.keys(props ?? {}).every(
            key => !['datasources', 'locked', 'id', 'puck'].includes(key)
          )
        )
      ).toBe(true);
      expect(container.innerHTML).not.toContain(`${type}-1`);
    }
  );
});
