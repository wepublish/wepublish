import { CustomField } from '@puckeditor/core';
import { ArticleField } from './article.component';
import { ComponentProps } from 'react';

export const articleField: CustomField<
  ComponentProps<typeof ArticleField>['value']
> = {
  type: 'custom',
  render: ArticleField,
};
