import { Plugin } from '@puckeditor/core';

import { PuckDocumentControllerBridge } from './puck-document-controller.component';

export const documentControllerPlugin: Plugin = {
  name: 'document-controller',
  overrides: {
    puck: PuckDocumentControllerBridge,
  },
};
