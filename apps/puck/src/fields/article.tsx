import { CustomField } from '@measured/puck';
import { ArticleField } from './article.component';
import { ComponentProps } from 'react';

export const articleField: CustomField<
  ComponentProps<typeof ArticleField>['value']
> = {
  type: 'custom',
  render: ArticleField,
};
