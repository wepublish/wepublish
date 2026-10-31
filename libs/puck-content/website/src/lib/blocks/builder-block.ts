import { ComponentType, createElement } from 'react';

import { PuckBlockComponent } from './block.types';

type WithClassName = { className?: string };

const adaptBlock =
  <Props extends object>(
    Component: ComponentType<Props & WithClassName>
  ): PuckBlockComponent<Props> =>
  ({ props, className }) =>
    createElement(Component, { ...props, className });

export const builderBlock = <Props extends object>(
  Component: ComponentType<Props & WithClassName>
): PuckBlockComponent<Props> => adaptBlock(Component);

export const plainBlock = <Props extends object>(
  Component: ComponentType<Props & WithClassName>
): PuckBlockComponent<Props> => adaptBlock(Component);
