import React from 'react'
import {storiesOf} from '@storybook/react'

import {
  mockArticle,
  mockNavigationItems,
  mockBreakingArticle,
  mockImageTitleArticle
} from '../.storybook/storiesMockData'

import {BaseTemplate} from './baseTemplate'
import {DesktopSocialMediaButtons} from '../atoms/socialMediaButtons'
import {BlockRenderer} from '../blocks/blockRenderer'
import {ArticleFooter} from '../navigation/articleFooter'

// TODO mock articles for article types
storiesOf('Templates|ArticleTemplate', module)
  .add('Default', () => (
    <BaseTemplate
      navigationItems={mockNavigationItems}
      imprintNavigationItems={mockNavigationItems}
      headerNavigationItems={mockNavigationItems}
      footerNavigationItems={mockNavigationItems}>
      <DesktopSocialMediaButtons shareUrl="" />

      {mockArticle.blocks && (
        <BlockRenderer
          authors={mockArticle.authors}
          blocks={mockArticle.blocks}
          publishedAt={mockArticle.publishedAt}
          updatedAt={mockArticle.updatedAt}
        />
      )}

      <ArticleFooter
        peer={mockArticle.peer}
        tags={['Article Tag', 'Article Tag 2']}
        authors={mockArticle.authors}
        relatedArticles={[mockArticle, mockBreakingArticle, mockImageTitleArticle]}
      />
    </BaseTemplate>
  ))
  .add('Breaking', () => (
    <BaseTemplate
      navigationItems={mockNavigationItems}
      imprintNavigationItems={mockNavigationItems}
      headerNavigationItems={mockNavigationItems}
      footerNavigationItems={mockNavigationItems}>
      <DesktopSocialMediaButtons shareUrl="" />

      {mockArticle.blocks && (
        <BlockRenderer
          authors={mockBreakingArticle.authors}
          blocks={mockBreakingArticle.blocks}
          publishedAt={mockBreakingArticle.publishedAt}
          updatedAt={mockBreakingArticle.updatedAt}
        />
      )}

      <ArticleFooter
        peer={mockBreakingArticle.peer}
        tags={['Article Tag', 'Article Tag 2']}
        authors={mockBreakingArticle.authors}
        relatedArticles={[mockArticle, mockBreakingArticle, mockImageTitleArticle]}
      />
    </BaseTemplate>
  ))
  .add('Image', () => (
    <BaseTemplate
      navigationItems={mockNavigationItems}
      imprintNavigationItems={mockNavigationItems}
      headerNavigationItems={mockNavigationItems}
      footerNavigationItems={mockNavigationItems}>
      <DesktopSocialMediaButtons shareUrl="" />

      {mockArticle.blocks && (
        <BlockRenderer
          authors={mockImageTitleArticle.authors}
          blocks={mockImageTitleArticle.blocks}
          publishedAt={mockImageTitleArticle.publishedAt}
          updatedAt={mockImageTitleArticle.updatedAt}
        />
      )}

      <ArticleFooter
        peer={mockImageTitleArticle.peer}
        tags={['Article Tag', 'Article Tag 2']}
        authors={mockImageTitleArticle.authors}
        relatedArticles={[mockArticle, mockBreakingArticle, mockImageTitleArticle]}
      />
    </BaseTemplate>
  ))
