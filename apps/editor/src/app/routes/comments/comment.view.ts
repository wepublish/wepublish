import {
  type FormValues,
  bindComponent,
  formView,
} from '@wepublish/form/editor';

import { commentSchema } from './comment.schema';
import { CommentActions } from './commentActions';
import { RatingOverrideRow, RatingOverrides } from './commentRatingOverrides';
import { CommentThread } from './commentThread';

const withoutRatingSystem = ({
  ratingOverrides,
}: FormValues<typeof commentSchema>) => !ratingOverrides?.length;

export const commentView = formView(commentSchema, {
  paths: {
    list: '/comments',
    edit: id => `/comments/edit/${id}`,
  },
  sections: [
    {
      title: 'commentEditView.sections.content',
      fields: ['title', 'lead', 'text'],
    },
    {
      title: 'commentEditView.commentContextHeader',
      component: CommentThread,
    },
    {
      title: 'commentEditView.actions',
      placement: 'aside',
      component: CommentActions,
    },
    {
      title: 'commentEditView.variousPanelHeader',
      placement: 'aside',
      fields: ['featured', 'tagIds', 'source'],
    },
    {
      title: 'commentEditView.userPanelHeader',
      placement: 'aside',
      fields: ['user', 'guestUsername', 'guestUserImage'],
    },
    {
      title: 'commentEditView.ratingOverrides',
      description: 'commentEditView.ratingOverridesInfo',
      placement: 'aside',
      hidden: withoutRatingSystem,
      fields: ['ratingOverrides'],
    },
  ],
  fields: {
    ratingOverrides: { component: bindComponent(RatingOverrides) },
    'ratingOverrides.*': { layout: RatingOverrideRow },
  },
});
