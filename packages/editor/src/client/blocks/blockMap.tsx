import EventDetailIcon from '@rsuite/icons/EventDetail'
import CloneIcon from '@rsuite/icons/legacy/Clone'
import CodeIcon from '@rsuite/icons/legacy/Code'
import CoffeeIcon from '@rsuite/icons/legacy/Coffee'
import ColumnsIcon from '@rsuite/icons/legacy/Columns'
import CommentIcon from '@rsuite/icons/legacy/Comment'
import EllipsisHIcon from '@rsuite/icons/legacy/EllipsisH'
import EllipsisVIcon from '@rsuite/icons/legacy/EllipsisV'
import FileTextIcon from '@rsuite/icons/legacy/FileText'
import HeaderIcon from '@rsuite/icons/legacy/Header'
import ImageIcon from '@rsuite/icons/legacy/Image'
import QuoteLeftIcon from '@rsuite/icons/legacy/QuoteLeft'
import ThListIcon from '@rsuite/icons/legacy/ThList'
import PieChartIcon from '@rsuite/icons/PieChart'
import nanoid from 'nanoid'
import React from 'react'

import {BlockMapForValue} from '../atoms/blockList'
import {CommentBlock} from './commentBlock'
import {EmbedBlock} from './embedBlock'
import {EventBlock} from './eventBlock'
import {HTMLBlock} from './htmlBlock'
import {ImageBlock} from './imageBlock'
import {ImageGalleryBlock} from './imageGalleryBlock'
import {LinkPageBreakBlock} from './linkPageBreakBlock'
import {ListicleBlock} from './listicleBlock'
import {PollBlock} from './pollBlock'
import {QuoteBlock} from './quoteBlock'
import {createDefaultValue, RichTextBlock} from './richTextBlock/richTextBlock'
import {TeaserGridBlock} from './teaserGridBlock'
import {TeaserGridFlexBlock} from './teaserGridFlexBlock'
import {TitleBlock} from './titleBlock'
import {BlockType, BlockValue, EmbedType} from './types'

export const BlockMap: BlockMapForValue<BlockValue> = {
  [BlockType.Title]: {
    field: props => <TitleBlock {...props} />,
    defaultValue: {title: '', lead: ''},
    label: 'blocks.title.label',
    icon: <HeaderIcon />
  },

  [BlockType.RichText]: {
    field: props => <RichTextBlock {...props} />,
    defaultValue: createDefaultValue,
    label: 'blocks.richText.label',
    icon: <FileTextIcon />
  },

  [BlockType.Image]: {
    field: props => <ImageBlock {...props} />,
    defaultValue: {image: null, caption: ''},
    label: 'blocks.image.label',
    icon: <ImageIcon />
  },

  [BlockType.ImageGallery]: {
    field: props => <ImageGalleryBlock {...props} />,
    defaultValue: {images: [{caption: '', image: null}]},
    label: 'blocks.imageGallery.label',
    icon: <CloneIcon />
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
    icon: <ThListIcon />
  },

  [BlockType.Quote]: {
    field: props => <QuoteBlock {...props} />,
    defaultValue: {quote: '', author: ''},
    label: 'blocks.quote.label',
    icon: <QuoteLeftIcon />
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
    icon: <CoffeeIcon />
  },

  [BlockType.Embed]: {
    field: props => <EmbedBlock {...props} />,
    defaultValue: {type: EmbedType.Other},
    label: 'blocks.embeds.label',
    icon: <CodeIcon />
  },

  [BlockType.TeaserGrid1]: {
    field: props => <TeaserGridBlock {...props} />,
    defaultValue: {numColumns: 1, teasers: [[nanoid(), null]]},
    label: 'blocks.teaserGrid1.label',
    icon: <EllipsisVIcon />
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
    icon: <EllipsisHIcon />
  },

  [BlockType.TeaserGridFlex]: {
    field: props => <TeaserGridFlexBlock {...props} />,
    defaultValue: {
      flexTeasers: [
        {
          alignment: {i: nanoid(), x: 0, y: 0, w: 3, h: 6, static: false},
          teaser: null
        },
        {
          alignment: {i: nanoid(), x: 3, y: 0, w: 5, h: 3, static: false},
          teaser: null
        },
        {
          alignment: {i: nanoid(), x: 3, y: 3, w: 5, h: 3, static: false},
          teaser: null
        },
        {
          alignment: {i: nanoid(), x: 8, y: 0, w: 4, h: 6, static: false},
          teaser: null
        }
      ]
    },
    label: 'blocks.teaserFlexGrid.label',
    icon: <ColumnsIcon />
  },

  [BlockType.HTMLBlock]: {
    field: props => <HTMLBlock {...props} />,
    defaultValue: {html: ''},
    label: 'blocks.html.label',
    icon: <CodeIcon />
  },

  [BlockType.PollBlock]: {
    field: props => <PollBlock {...props} />,
    defaultValue: {poll: null},
    label: 'blocks.poll.label',
    icon: <PieChartIcon />
  },

  [BlockType.CommentBlock]: {
    field: props => <CommentBlock {...props} />,
    defaultValue: {filter: {}, comments: []},
    label: 'blocks.comment.label',
    icon: <CommentIcon />
  },

  [BlockType.EventBlock]: {
    field: props => <EventBlock {...props} />,
    defaultValue: {filter: {}, events: []},
    label: 'blocks.event.label',
    icon: <EventDetailIcon />
  }
}
