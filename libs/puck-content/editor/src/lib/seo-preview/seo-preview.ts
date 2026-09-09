import { Plugin } from '@puckeditor/core';
import { createElement } from 'react';
import { MdCardMembership } from 'react-icons/md';

import { SeoPreview } from './seo-preview.component';

export const SEOPreviewPlugin: Plugin = {
  icon: createElement(MdCardMembership, { size: 24 }),
  label: 'SEO Audit',
  name: 'seo-preview',
  render: SeoPreview,
};
