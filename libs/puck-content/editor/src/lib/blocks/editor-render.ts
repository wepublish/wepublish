import { PuckComponent, PuckContext } from '@puckeditor/core';
import { PuckBlockComponent } from '@wepublish/puck-content/website';
import { createElement, ReactNode } from 'react';

import { BlockVisibilityValue } from '../block-visibility/block-visibility.field';
import { DatasourcesValue } from '../datasource/datasource.field';
import { BreakpointStylingValue } from '../styling/styling.field';
import { EditorBlock } from './editor-block.component';
import { ToPuckSlots } from './puck-editor-props';

export type EditorRenderContext<Props> = {
  id: string;
  props: Props;
  puck: PuckContext;
};

export type EditorRenderOptions<Props, Extra> = {
  inline?: boolean;
  minEmptyHeight?: number;
  editingProps?: (props: Props) => Partial<Props>;
  useExtra?: (context: EditorRenderContext<Props>) => Partial<Extra>;
  decorate?: (
    element: ReactNode,
    context: EditorRenderContext<Props>
  ) => ReactNode;
};

export type EditorRenderProps<Props> = ToPuckSlots<Props> & {
  className?: string;
  styling?: BreakpointStylingValue;
  visibility?: BlockVisibilityValue;
  datasources?: DatasourcesValue;
  locked?: boolean;
  grouped?: boolean;
};

export const editorRender =
  <Props, Extra = object>(
    component: PuckBlockComponent<Props, Extra>,
    options: EditorRenderOptions<Props, Extra> = {}
  ): PuckComponent<EditorRenderProps<Props>> =>
  puckProps =>
    createElement(EditorBlock<Props, Extra>, {
      component,
      options,
      puckProps,
    });
