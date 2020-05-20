import React from 'react'
import nanoid from 'nanoid'

import {
  MaterialIconTitle,
  MaterialIconTextFormat,
  MaterialIconImage,
  MaterialIconFormatQuote,
  MaterialIconViewDay,
  MaterialIconCode,
  IconColumn1,
  IconColumn6
} from '@karma.run/icons'

import {BlockMapForValue} from '@karma.run/ui'

import {BlockType, EmbedType, BlockValue} from './types'
import {TitleBlock} from './titleBlock'
import {RichTextBlock, createDefaultValue} from './richTextBlock'
import {ImageBlock} from './imageBlock'
import {QuoteBlock} from './quoteBlock'
import {LinkPageBreakBlock} from './linkPageBreakBlock'
import {EmbedBlock} from './embedBlock'
import {TeaserGridBlock} from './teaserGridBlock'

export const BlockMap: BlockMapForValue<BlockValue> = {
  [BlockType.Title]: {
    field: props => <TitleBlock {...props} />,
    defaultValue: {title: '', lead: ''},
    label: 'Title',
    icon: MaterialIconTitle
  },

  [BlockType.RichText]: {
    field: props => <RichTextBlock {...props} />,
    defaultValue: createDefaultValue,
    label: 'Rich Text',
    icon: MaterialIconTextFormat
  },

  [BlockType.Image]: {
    field: props => <ImageBlock {...props} />,
    defaultValue: {image: null, caption: ''},
    label: 'Image',
    icon: MaterialIconImage
  },

  [BlockType.ImageGallery]: {
    field: props => <div />,
    defaultValue: {images: []},
    label: 'Gallery',
    icon: MaterialIconImage
  },

  [BlockType.Listicle]: {
    field: props => <div />,
    defaultValue: {items: []},
    label: 'Listicle',
    icon: MaterialIconImage
  },

  [BlockType.Quote]: {
    field: props => <QuoteBlock {...props} />,
    defaultValue: {quote: '', author: ''},
    label: 'Quote',
    icon: MaterialIconFormatQuote
  },

  [BlockType.LinkPageBreak]: {
    field: props => <LinkPageBreakBlock {...props} />,
    defaultValue: {text: '', linkText: '', linkURL: ''},
    label: 'Page Break',
    icon: MaterialIconViewDay
  },

  [BlockType.Embed]: {
    field: props => <EmbedBlock {...props} />,
    defaultValue: {type: EmbedType.Other},
    label: 'Embed',
    icon: MaterialIconCode
  },

  [BlockType.ArticleTeaserGrid1]: {
    field: props => <TeaserGridBlock {...props} />,
    defaultValue: {numColumns: 1, teasers: [[nanoid(), null]]},
    label: '1 Col',
    icon: IconColumn1
  },

  [BlockType.ArticleTeaserGrid6]: {
    field: props => <TeaserGridBlock {...props} />,
    defaultValue: {
      numColumns: 3,
      teasers: [
        [nanoid(), null],
        [nanoid(), null],
        [nanoid(), null],
        [nanoid(), null],
        [nanoid(), null],
        [nanoid(), null]
      ]
    },
    label: '6 Cols',
    icon: IconColumn6
  }
}
