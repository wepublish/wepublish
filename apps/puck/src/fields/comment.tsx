import { CustomField } from '@measured/puck';
import { CommentField } from './comment.component';
import { ComponentProps } from 'react';

export const commentField: CustomField<
  ComponentProps<typeof CommentField>['value']
> = {
  type: 'custom',
  label: 'Comment',
  render: CommentField,
};
