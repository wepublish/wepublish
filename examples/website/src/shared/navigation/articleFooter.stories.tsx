import React from 'react'
import {storiesOf} from '@storybook/react'
import {ArticleFooter} from './articleFooter'
import {
  mockTags,
  mockArticle,
  mockAuthors,
  mockBreakingArticle,
  mockImageTitleArticle
} from '../.storybook/storiesMockData'

storiesOf('Navigation|ArticleFooter', module)
  .add('2 Related Articles', () => (
    <ArticleFooter
      relatedArticles={[mockArticle, mockBreakingArticle]}
      tags={mockTags}
      authors={mockAuthors}
    />
  ))
  .add('3 Related Articles', () => (
    <ArticleFooter
      relatedArticles={[mockArticle, mockBreakingArticle, mockImageTitleArticle]}
      tags={mockTags}
      authors={mockAuthors}
    />
  ))
  .add('No author', () => (
    <ArticleFooter
      relatedArticles={[mockArticle, mockBreakingArticle, mockImageTitleArticle]}
      tags={mockTags}
    />
  ))
