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
  IconColumn6,
  MaterialIconCollections,
  MaterialIconList,
  MaterialIconMap
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
import {ImageGalleryBlock} from './imageGalleryBlock'
import {ListicleBlock} from './listicleBlock'
import {MapLeafletBlock} from './mapLeafletBlock/mapLeafletBlock'

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
    field: props => <ImageGalleryBlock {...props} />,
    defaultValue: {images: [{caption: '', image: null}]},
    label: 'Gallery',
    icon: MaterialIconCollections
  },

  [BlockType.MapLeaflet]: {
    field: props => <MapLeafletBlock {...props} />,
    defaultValue: {
      centerLat: 47.3778762,
      centerLng: 8.5271078,
      centerAddress: '',
      zoom: 8,
      caption: '',
      items: [
        {
          id: nanoid(),
          value: {
            address: '',
            lat: 0,
            lng: 0,
            title: '',
            description: '',
            image: null
          }
        }
      ]
    },
    label: 'MapLeaflet',
    icon: MaterialIconMap
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
    icon: MaterialIconList
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
    label: 'Break',
    icon: MaterialIconViewDay
  },

  [BlockType.Embed]: {
    field: props => <EmbedBlock {...props} />,
    defaultValue: {type: EmbedType.Other},
    label: 'Embed',
    icon: MaterialIconCode
  },

  [BlockType.TeaserGrid1]: {
    field: props => <TeaserGridBlock {...props} />,
    defaultValue: {numColumns: 1, teasers: [[nanoid(), null]]},
    label: '1 Col',
    icon: IconColumn1
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
    icon: IconColumn6
  }
}
