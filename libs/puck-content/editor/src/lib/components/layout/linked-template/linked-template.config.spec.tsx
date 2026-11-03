import { PuckContext } from '@puckeditor/core';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import {
  emptyPuckBlockData,
  LINKED_TEMPLATE_TYPE,
} from '@wepublish/puck-content/website';
import { ComponentType, createElement } from 'react';

import { PuckBlockDataContext } from '../../../block-data/puck-block-data.context';
import { catalogFromComponents } from '../../../block-library/block-library.helpers';
import { layoutComponents } from '../layout.blocks';
import { LinkedTemplateConfig } from './linked-template.config';

const puck = (overrides: Partial<PuckContext> = {}): PuckContext => ({
  renderDropZone: () => null,
  isEditing: true,
  dragRef: null,
  metadata: {},
  ...overrides,
});

const template = {
  __typename: 'PuckBlockTemplateData' as const,
  id: 'tpl',
  name: 'Rubric header',
  puckRegistry: null,
  puckBlocks: [
    {
      __typename: 'PuckBlock' as const,
      id: 'linked-1/title',
      kind: 'puck',
      type: 'Title',
      parentId: null,
      puckSlot: null,
      position: 0,
      locked: null,
      grouped: null,
      visibility: null,
      styling: null,
      datasources: null,
      props: { title: 'From the template' },
      data: { __typename: 'PuckBlockData' as const, ...emptyPuckBlockData },
    },
  ],
};

const renderLinked = (data: unknown) =>
  renderWithProviders(
    <PuckBlockDataContext.Provider
      value={new Map(data === undefined ? [] : [['linked-1', data as never]])}
    >
      {createElement(
        layoutComponents.LinkedTemplate.render as ComponentType<
          Record<string, unknown>
        >,
        { id: 'linked-1', templateId: 'tpl', puck: puck() }
      )}
    </PuckBlockDataContext.Provider>
  );

describe('LinkedTemplateConfig', () => {
  it('is inserted from the saved blocks, never from the block catalog', () => {
    expect(LinkedTemplateConfig.hidden).toBe(true);
    expect(
      catalogFromComponents({ LinkedTemplate: LinkedTemplateConfig })
    ).toEqual([]);
    expect(LinkedTemplateConfig.nameKey).toBe(
      'puck.blocks.names.LinkedTemplate'
    );
  });

  it('only points at a block template of the page builder', () => {
    expect(LinkedTemplateConfig.fields).toEqual({
      templateId: expect.objectContaining({
        type: 'record',
        model: 'blockTemplate',
      }),
    });
    expect(LINKED_TEMPLATE_TYPE).toBe('LinkedTemplate');
  });

  it('keeps the linked content out of reach of Puck AI', () => {
    expect(LinkedTemplateConfig.metadata?.ai?.exclude).toBe(true);
  });
});

describe('LinkedTemplate in the canvas', () => {
  it('shows the current content of the template read-only with a badge', () => {
    const { container } = renderLinked({ ...emptyPuckBlockData, template });

    expect(screen.getByText('From the template')).toBeInTheDocument();
    expect(
      screen.getByText('Linked template: Rubric header')
    ).toBeInTheDocument();
    expect(container.querySelector('[inert]')).toContainElement(
      screen.getByText('From the template')
    );
  });

  it('says so when the template no longer exists', () => {
    renderLinked({ ...emptyPuckBlockData, template: null });

    expect(
      screen.getByText('The linked block template no longer exists.')
    ).toBeInTheDocument();
  });

  it('waits for the template while the preview is loading', () => {
    renderLinked(undefined);

    expect(
      screen.getByText('Loading the linked block template…')
    ).toBeInTheDocument();
  });
});
