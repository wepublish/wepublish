import { PuckContext } from '@puckeditor/core';
import {
  PuckBlockComponent,
  PuckBlockRenderProps,
  TeaserSlotBoundary,
} from '@wepublish/puck-content/website';
import { createElement, ReactNode } from 'react';

import { usePuckBlockData } from '../block-data/puck-block-data.context';
import type { EditorRenderContext, EditorRenderOptions } from './editor-render';
import { splitPuckRenderProps } from './puck-editor-props';

export type EditorBlockProps<Props, Extra> = {
  component: PuckBlockComponent<Props, Extra>;
  options: EditorRenderOptions<Props, Extra>;
  puckProps: { id: string; puck: PuckContext; [key: string]: unknown };
};

const useNoExtra = <Extra,>(): Partial<Extra> => ({});

export const EditorBlock = <Props, Extra>({
  component: Component,
  options,
  puckProps,
}: EditorBlockProps<Props, Extra>) => {
  const { inline, minEmptyHeight, editingProps, decorate } = options;
  const { puck } = puckProps;
  const { id, props, slots, className, styling, visibility, datasources } =
    splitPuckRenderProps<Props>(puckProps, { minEmptyHeight });
  const data = usePuckBlockData(id);
  const useExtra = options.useExtra ?? useNoExtra<Extra>;
  const shownProps =
    puck.isEditing && editingProps ?
      { ...props, ...editingProps(props) }
    : props;
  const context: EditorRenderContext<Props> = { id, props: shownProps, puck };
  const extra = useExtra(context);
  const shownExtra: Partial<Extra> = puck.isEditing ? extra : {};
  const renderProps: PuckBlockRenderProps<Props, Extra> = {
    ...shownExtra,
    id,
    props: shownProps,
    data,
    slots,
    styling,
    visibility,
    className,
    ref: (inline && puck.dragRef) || undefined,
  };

  const element: ReactNode = createElement(Component, renderProps);

  return (
    <TeaserSlotBoundary
      datasources={datasources}
      data={data}
    >
      {puck.isEditing && decorate ? decorate(element, context) : element}
    </TeaserSlotBoundary>
  );
};
