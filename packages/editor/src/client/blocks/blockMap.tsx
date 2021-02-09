import React from 'react'
import nanoid from 'nanoid'

import {BlockMapForValue} from '../atoms/blockList'

import {BlockType, EmbedType, BlockValue} from './types'
import {TitleBlock} from './titleBlock'
import {RichTextBlock, createDefaultValue} from './richTextBlock/richTextBlock'
import {ImageBlock} from './imageBlock'
import {QuoteBlock} from './quoteBlock'
import {LinkPageBreakBlock} from './linkPageBreakBlock'
import {EmbedBlock} from './embedBlock'
import {TeaserGridBlock} from './teaserGridBlock'
import {TeaserFlexGridBlock} from './teaserFlexGridBlock'
import {ImageGalleryBlock} from './imageGalleryBlock'
import {ListicleBlock} from './listicleBlock'

export const BlockMap: BlockMapForValue<BlockValue> = {
  [BlockType.Title]: {
    field: props => <TitleBlock {...props} />,
    defaultValue: {title: '', lead: ''},
    label: 'Title',
    icon: 'header'
  },

  [BlockType.RichText]: {
    field: props => <RichTextBlock {...props} />,
    defaultValue: createDefaultValue,
    label: 'Rich Text',
    icon: 'file-text'
  },

  [BlockType.Image]: {
    field: props => <ImageBlock {...props} />,
    defaultValue: {image: null, caption: ''},
    label: 'Image',
    icon: 'image'
  },

  [BlockType.ImageGallery]: {
    field: props => <ImageGalleryBlock {...props} />,
    defaultValue: {images: [{caption: '', image: null}]},
    label: 'Gallery',
    icon: 'clone'
  },

  [BlockType.Listicle]: {
    field: props => <ListicleBlock {...props} />,
    defaultValue: {
      items: [
        {
          id: nanoid(),
          value: {
            image: null,
            title: '',
            richText: createDefaultValue()
          }
        }
      ]
    },
    label: 'Listicle',
    icon: 'th-list'
  },

  [BlockType.Quote]: {
    field: props => <QuoteBlock {...props} />,
    defaultValue: {quote: '', author: ''},
    label: 'Quote',
    icon: 'quote-left'
  },

  [BlockType.LinkPageBreak]: {
    field: props => <LinkPageBreakBlock {...props} />,
    defaultValue: {
      text: '',
      linkText: '',
      linkTarget: '',
      linkURL: '',
      styleOption: 'default',
      layoutOption: 'default',
      templateOption: 'none',
      richText: createDefaultValue(),
      image: undefined,
      hideButton: false
    },
    label: 'Break',
    icon: 'coffee'
  },

  [BlockType.Embed]: {
    field: props => <EmbedBlock {...props} />,
    defaultValue: {type: EmbedType.Other},
    label: 'Embed',
    icon: 'code'
  },

  [BlockType.TeaserGrid1]: {
    field: props => <TeaserGridBlock {...props} />,
    defaultValue: {numColumns: 1, teasers: [[nanoid(), null]]},
    label: '1 Col',
    icon: 'ellipsis-v'
  },

  [BlockType.TeaserGrid6]: {
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
    icon: 'ellipsis-h'
  },

  [BlockType.TeaserFlexGrid]: {
    field: props => <TeaserFlexGridBlock {...props} />,
    defaultValue: {
      numColumns: 12,
      numRows: 3,
      teasers: [
        {layout: {x: 0, y: 0, w: 12, h: 5}, teaser: null},
        {layout: {x: 0, y: Infinity, w: 5, h: 6}, teaser: null},
        {layout: {x: 6, y: Infinity, w: 5, h: 4}, teaser: null}
      ]
    },
    label: 'Flex Grid',
    icon: 'squares'
  }
}
