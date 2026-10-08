import { CommentItemType } from '@wepublish/editor/api';

import { commentItemLink } from './commentItemLink';

describe('commentItemLink', () => {
  it('opens the article a comment belongs to', () => {
    expect(commentItemLink(CommentItemType.Article, 'article-1')).toEqual({
      path: '/articles/edit/article-1',
      labelKey: 'commentEditView.goToArticle',
    });
  });

  it('opens the page a comment belongs to', () => {
    expect(commentItemLink(CommentItemType.Page, 'page-1')).toEqual({
      path: '/pages/edit/page-1',
      labelKey: 'commentEditView.goToPage',
    });
  });
});
