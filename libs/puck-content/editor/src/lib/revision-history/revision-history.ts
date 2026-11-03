import { Plugin } from '@puckeditor/core';
import { createElement, Fragment } from 'react';

import { RevisionHistory } from './revision-history.component';
import {
  RevisionPreviewBanner,
  RevisionPreviewFrame,
  RevisionPreviewProvider,
} from './revision-preview.component';

export const RevisionHistoryPlugin: Plugin = {
  label: 'History',
  name: 'revisioning',
  render: RevisionHistory,
  overrides: {
    puck: props => createElement(RevisionPreviewProvider, props),
    iframe: props => createElement(RevisionPreviewFrame, props),
  },
};

export const revisionPreviewHeaderPlugin: Plugin = {
  name: 'revision-preview-header',
  overrides: {
    header: ({ children }) =>
      createElement(
        Fragment,
        null,
        children,
        createElement(RevisionPreviewBanner)
      ),
  },
};
