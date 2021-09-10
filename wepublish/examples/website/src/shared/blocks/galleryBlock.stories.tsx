import React from 'react'
import {storiesOf} from '@storybook/react'
import {GalleryBlock} from './galleryBlock'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {mockGalleryMedia} from '../.storybook/storiesMockData'

storiesOf('Blocks|GalleryBlock', module)
  .add('Empty', () => <GalleryBlock media={[]} loop={true} />)
  .add('Only One Image', () => <GalleryBlock media={[mockGalleryMedia[0]]} loop={false} />)
  .add('Loop Gallery', () => <GalleryBlock media={mockGalleryMedia} loop={true} />)
  .add('Non-loop Gallery', () => <GalleryBlock media={mockGalleryMedia} loop={false} />)
