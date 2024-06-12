import nanoid from 'nanoid'
import {
  MdCode,
  MdCoffee,
  MdComment,
  MdEvent,
  MdFilter1,
  MdFilter6,
  MdFilter9Plus,
  MdFormatColorText,
  MdFormatQuote,
  MdIntegrationInstructions,
  MdPhoto,
  MdPhotoLibrary,
  MdQueryStats,
  MdTitle,
  MdViewList,
  MdViewQuilt
} from 'react-icons/md'

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
import {createDefaultValue, RichTextBlock} from './richTextBlock/rich-text-block'
import {TeaserGridBlock} from './teaserGridBlock'
import {TeaserGridFlexBlock} from './teaserGridFlexBlock'
import {TitleBlock} from './titleBlock'
import {BlockValue, EmbedType} from './types'
import {BlockType} from '@wepublish/editor/api-v2'
import {isFunctionalUpdate} from '../utility'
import {TeaserListBlock} from './teaserListBlock'
import {TeaserType} from '@wepublish/editor/api'

export const BlockMap: BlockMapForValue<BlockValue> = {
  [BlockType.Title]: {
    field: props => <TitleBlock {...props} />,
    defaultValue: {title: '', lead: '', blockStyle: undefined},
    label: 'blocks.title.label',
    icon: <MdTitle />
  },

  [BlockType.RichText]: {
    field: props => (
      <RichTextBlock
        {...props}
        value={props.value.richText}
        onChange={fieldValue =>
          props.onChange({
            ...props.value,
            richText: isFunctionalUpdate(fieldValue) ? fieldValue(props.value.richText) : fieldValue
          })
        }
      />
    ),
    defaultValue: {
      richText: createDefaultValue()
    },
    label: 'blocks.richText.label',
    icon: <MdFormatColorText />
  },

  [BlockType.Image]: {
    field: props => <ImageBlock {...props} />,
    defaultValue: {image: null, caption: '', blockStyle: undefined},
    label: 'blocks.image.label',
    icon: <MdPhoto />
  },

  [BlockType.ImageGallery]: {
    field: props => <ImageGalleryBlock {...props} />,
    defaultValue: {images: [{caption: '', image: null}], blockStyle: undefined},
    label: 'blocks.imageGallery.label',
    icon: <MdPhotoLibrary />
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
      ],
      blockStyle: undefined
    },
    label: 'blocks.listicle.label',
    icon: <MdViewList />
  },

  [BlockType.Quote]: {
    field: props => <QuoteBlock {...props} />,
    defaultValue: {quote: '', author: '', image: null, blockStyle: undefined},
    label: 'blocks.quote.label',
    icon: <MdFormatQuote />
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
      hideButton: false,
      blockStyle: undefined
    },
    label: 'blocks.linkPageBreak.label',
    icon: <MdCoffee />
  },

  [BlockType.Embed]: {
    field: props => <EmbedBlock {...props} />,
    defaultValue: {type: EmbedType.Other, blockStyle: undefined},
    label: 'blocks.embeds.label',
    icon: <MdIntegrationInstructions />
  },

  [BlockType.TeaserList]: {
    field: props => <TeaserListBlock {...props} />,
    defaultValue: {
      title: null,
      filter: {},
      blockStyle: undefined,
      teasers: [],
      skip: 0,
      take: 6,
      teaserType: TeaserType.Article
    },
    label: 'blocks.teaserList.label',
    icon: <MdFilter9Plus />
  },

  [BlockType.TeaserGrid1]: {
    field: props => <TeaserGridBlock {...props} />,
    defaultValue: {numColumns: 1, teasers: [[nanoid(), null]], blockStyle: undefined},
    label: 'blocks.teaserGrid1.label',
    icon: <MdFilter1 />
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
      ],
      blockStyle: undefined
    },
    label: 'blocks.teaserGrid6.label',
    icon: <MdFilter6 />
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
      ],
      blockStyle: undefined
    },
    label: 'blocks.teaserFlexGrid.label',
    icon: <MdViewQuilt />
  },

  [BlockType.Html]: {
    field: props => <HTMLBlock {...props} />,
    defaultValue: {html: '', blockStyle: undefined},
    label: 'blocks.html.label',
    icon: <MdCode />
  },

  [BlockType.Poll]: {
    field: props => <PollBlock {...props} />,
    defaultValue: {poll: null, blockStyle: undefined},
    label: 'blocks.poll.label',
    icon: <MdQueryStats />
  },

  [BlockType.Comment]: {
    field: props => <CommentBlock {...props} />,
    defaultValue: {filter: {}, comments: [], blockStyle: undefined},
    label: 'blocks.comment.label',
    icon: <MdComment />
  },

  [BlockType.Event]: {
    field: props => <EventBlock {...props} />,
    defaultValue: {filter: {}, events: [], blockStyle: undefined},
    label: 'blocks.event.label',
    icon: <MdEvent />
  }
}
