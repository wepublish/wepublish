import { Plugin } from '@puckeditor/core';
import { createElement } from 'react';

import {
  PuckDocumentHeader,
  PuckFrameDocumentProvider,
  PuckFrameDocumentRegistration,
} from './header.component';

export const documentHeaderPlugin: Plugin = {
  name: 'document-header',
  overrides: {
    header: () => createElement(PuckDocumentHeader),
    puck: props => createElement(PuckFrameDocumentProvider, props),
    iframe: props => createElement(PuckFrameDocumentRegistration, props),
  },
};
