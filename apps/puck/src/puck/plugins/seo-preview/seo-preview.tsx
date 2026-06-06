import { Plugin } from '@puckeditor/core';
import { SeoPreview } from './seo-preview.component';
import { MdCardMembership } from 'react-icons/md';

export const SEOPreviewPlugin: Plugin = {
  icon: <MdCardMembership size={24} />,
  label: 'SEO Audit',
  name: 'seo-preview',
  render: SeoPreview,
};
