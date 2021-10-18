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
import {ImageGalleryBlock} from './imageGalleryBlock'
import {ListicleBlock} from './listicleBlock'
import {TeaserFlexGridBlock} from './teaserFlexGridBlock'

export const BlockMap: BlockMapForValue<BlockValue> = {
  [BlockType.Title]: {
    field: props => <TitleBlock {...props} />,
    defaultValue: {title: '', lead: ''},
    label: 'blocks.title.label',
    icon: 'header'
  },

  [BlockType.RichText]: {
    field: props => <RichTextBlock {...props} />,
    defaultValue: createDefaultValue,
    label: 'blocks.richText.label',
    icon: 'file-text'
  },

  [BlockType.Image]: {
    field: props => <ImageBlock {...props} />,
    defaultValue: {image: null, caption: ''},
    label: 'blocks.image.label',
    icon: 'image'
  },

  [BlockType.ImageGallery]: {
    field: props => <ImageGalleryBlock {...props} />,
    defaultValue: {images: [{caption: '', image: null}]},
    label: 'blocks.imageGallery.label',
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
    label: 'blocks.listicle.label',
    icon: 'th-list'
  },

  [BlockType.Quote]: {
    field: props => <QuoteBlock {...props} />,
    defaultValue: {quote: '', author: ''},
    label: 'blocks.quote.label',
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
    label: 'blocks.linkPageBreak.label',
    icon: 'coffee'
  },

  [BlockType.Embed]: {
    field: props => <EmbedBlock {...props} />,
    defaultValue: {type: EmbedType.Other},
    label: 'blocks.embeds.label',
    icon: 'code'
  },

  [BlockType.TeaserGrid1]: {
    field: props => <TeaserGridBlock {...props} />,
    defaultValue: {numColumns: 1, teasers: [[nanoid(), null]]},
    label: 'blocks.teaserGrid1.label',
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
    label: 'blocks.teaserGrid6.label',
    icon: 'ellipsis-h'
  },

  [BlockType.TeaserGridFlex]: {
    field: props => <TeaserFlexGridBlock {...props} />,
    defaultValue: {
      flexTeasers: [
        {
          alignment: {i: nanoid(), x: 1, y: 1, w: 2, h: 2, static: false},
          teaser: null
        },
        {
          alignment: {i: nanoid(), x: 1, y: 1, w: 2, h: 2, static: false},
          teaser: null
        }
      ]
    },
    label: 'blocks.teaserFlexGrid.label',
    icon: 'columns'
  }
}
