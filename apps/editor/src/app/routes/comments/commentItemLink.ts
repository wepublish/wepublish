import { CommentItemType } from '@wepublish/editor/api';

export function commentItemLink(itemType: CommentItemType, itemID: string) {
  return itemType === CommentItemType.Page ?
      { path: `/pages/edit/${itemID}`, labelKey: 'commentEditView.goToPage' }
    : {
        path: `/articles/edit/${itemID}`,
        labelKey: 'commentEditView.goToArticle',
      };
}
