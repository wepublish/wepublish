import '@puckeditor/plugin-heading-analyzer/dist/index.css';

import { Plugin } from '@puckeditor/core';
import headingAnalyzer from '@puckeditor/plugin-heading-analyzer';

import { HeadingAudit } from './heading-analyzer.component';

export const HeadingAnalyzerPlugin: Plugin = {
  ...headingAnalyzer,
  label: 'Heading audit',
  render: HeadingAudit,
};
