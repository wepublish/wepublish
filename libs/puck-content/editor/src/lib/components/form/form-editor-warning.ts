import { FormProps } from '@wepublish/puck-content/website';
import { createElement, Fragment, ReactNode } from 'react';

import { EditorRenderContext } from '../../blocks/editor-render';
import {
  FormHints,
  FormPlacementWarning,
  OwnFormWarning,
} from './form-editor-warning.component';

export const decorateFormField = (element: ReactNode) =>
  createElement(Fragment, null, element, createElement(FormPlacementWarning));

export const decorateOwnForm = (element: ReactNode) =>
  createElement(Fragment, null, element, createElement(OwnFormWarning));

export const decorateForm = (
  element: ReactNode,
  { props }: EditorRenderContext<FormProps>
) =>
  createElement(
    Fragment,
    null,
    createElement(FormHints, { action: props.action }),
    element
  );
