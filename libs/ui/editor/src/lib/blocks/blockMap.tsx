import {
  EditorBlockType,
  SubscribeBlockField,
  TeaserListBlockSort,
  TeaserSlotType,
  TeaserType,
} from '@wepublish/editor/api-v2';
import nanoid from 'nanoid';
import {
  MdAccountBox,
  MdCode,
  MdCoffee,
  MdComment,
  MdEvent,
  MdFilter,
  MdFilter1,
  MdFilter6,
  MdFilter9Plus,
  MdFormatColorText,
  MdFormatQuote,
  MdIntegrationInstructions,
  MdMoney,
  MdPhoto,
  MdPhotoLibrary,
  MdQueryStats,
  MdTitle,
  MdViewList,
  MdViewQuilt,
} from 'react-icons/md';

import { BlockMapForValue } from '../atoms/blockList';
import { isFunctionalUpdate } from '../utility';
import { CommentBlock } from './commentBlock';
import { CrowdfundingBlock } from './CrowdfundingBlock';
import { EmbedBlock } from './embedBlock';
import { EventBlock } from './eventBlock';
import { FlexBlock } from './flexBlock';
import { HTMLBlock } from './htmlBlock';
import { ImageBlock } from './imageBlock';
import { ImageGalleryBlock } from './imageGalleryBlock';
import { LinkPageBreakBlock } from './linkPageBreakBlock';
import { ListicleBlock } from './listicleBlock';
import { PollBlock } from './pollBlock';
import { QuoteBlock } from './quoteBlock';
import {
  createDefaultValue,
  RichTextBlock,
} from './richTextBlock/rich-text-block';
import { SubscribeBlock } from './subscribeBlock';
import { TeaserGridBlock } from './teaserGridBlock';
import { TeaserGridFlexBlock } from './teaserGridFlexBlock';
import { TeaserListBlock } from './teaserListBlock';
import { TeaserSlotsBlock } from './teaserSlotsBlock';
import { TitleBlock } from './titleBlock';
import { BlockValue, EmbedType } from './types';

export const BlockMap: BlockMapForValue<BlockValue> = {
  [EditorBlockType.Title]: {
    field: props => <TitleBlock {...props} />,
    defaultValue: { title: '', lead: '', preTitle: '', blockStyle: undefined },
    label: 'blocks.title.label',
    icon: <MdTitle />,
  },

  [EditorBlockType.RichText]: {
    field: props => (
      <RichTextBlock
        {...props}
        value={props.value.richText}
        onChange={fieldValue =>
          props.onChange({
            ...props.value,
            richText:
              isFunctionalUpdate(fieldValue) ?
                fieldValue(props.value.richText)
              : fieldValue,
          })
        }
      />
    ),
    defaultValue: {
      richText: createDefaultValue(),
    },
    label: 'blocks.richText.label',
    icon: <MdFormatColorText />,
  },

  [EditorBlockType.Image]: {
    field: props => <ImageBlock {...props} />,
    defaultValue: { image: null, caption: '', blockStyle: undefined },
    label: 'blocks.image.label',
    icon: <MdPhoto />,
  },

  [EditorBlockType.ImageGallery]: {
    field: props => <ImageGalleryBlock {...props} />,
    defaultValue: {
      images: [{ caption: '', image: null }],
      blockStyle: undefined,
    },
    label: 'blocks.imageGallery.label',
    icon: <MdPhotoLibrary />,
  },

  [EditorBlockType.Listicle]: {
    field: props => <ListicleBlock {...props} />,
    defaultValue: {
      items: [
        {
          id: nanoid(),
          value: {
            image: null,
            title: '',
            richText: createDefaultValue(),
          },
        },
      ],
      blockStyle: undefined,
    },
    label: 'blocks.listicle.label',
    icon: <MdViewList />,
  },

  [EditorBlockType.Quote]: {
    field: props => <QuoteBlock {...props} />,
    defaultValue: { quote: '', author: '', image: null, blockStyle: undefined },
    label: 'blocks.quote.label',
    icon: <MdFormatQuote />,
  },

  [EditorBlockType.LinkPageBreak]: {
    field: props => <LinkPageBreakBlock {...props} />,
    defaultValue: {
      text: '',
      linkText: '',
      linkTarget: '',
      linkURL: '',
      richText: createDefaultValue(),
      image: undefined,
      hideButton: false,
      blockStyle: undefined,
    },
    label: 'blocks.linkPageBreak.label',
    icon: <MdCoffee />,
  },

  [EditorBlockType.Embed]: {
    field: props => <EmbedBlock {...props} />,
    defaultValue: { type: EmbedType.Other, blockStyle: undefined },
    label: 'blocks.embeds.label',
    icon: <MdIntegrationInstructions />,
  },

  [EditorBlockType.TeaserList]: {
    field: props => <TeaserListBlock {...props} />,
    defaultValue: {
      title: null,
      filter: {
        tagObjects: [],
      },
      blockStyle: undefined,
      teasers: [],
      skip: 0,
      take: 6,
      sort: TeaserListBlockSort.PublishedAt,
      teaserType: TeaserType.Article,
    },
    label: 'blocks.teaserList.label',
    icon: <MdFilter9Plus />,
  },

  [EditorBlockType.TeaserGrid1]: {
    field: props => <TeaserGridBlock {...props} />,
    defaultValue: {
      numColumns: 1,
      teasers: [[nanoid(), null]],
      blockStyle: undefined,
    },
    label: 'blocks.teaserGrid1.label',
    icon: <MdFilter1 />,
  },

  [EditorBlockType.TeaserGrid6]: {
    field: props => <TeaserGridBlock {...props} />,
    defaultValue: {
      numColumns: 3,
      teasers: [
        [nanoid(), null],
        [nanoid(), null],
        [nanoid(), null],
        [nanoid(), null],
        [nanoid(), null],
        [nanoid(), null],
      ],
      blockStyle: undefined,
    },
    label: 'blocks.teaserGrid6.label',
    icon: <MdFilter6 />,
  },

  [EditorBlockType.TeaserSlots]: {
    field: props => <TeaserSlotsBlock {...props} />,
    defaultValue: {
      title: null,
      blockStyle: undefined,
      autofillConfig: {
        enabled: false,
        filter: {
          tags: [],
        },
        sort: TeaserListBlockSort.PublishedAt,
        teaserType: TeaserType.Article,
      },
      slots: [
        { type: TeaserSlotType.Manual },
        { type: TeaserSlotType.Manual },
        { type: TeaserSlotType.Manual },
        { type: TeaserSlotType.Manual },
        { type: TeaserSlotType.Manual },
        { type: TeaserSlotType.Manual },
      ],
      autofillTeasers: [],
      teasers: [],
    },
    label: 'blocks.teaserSlots.label',
    icon: <MdFilter />,
  },

  [EditorBlockType.TeaserGridFlex]: {
    field: props => <TeaserGridFlexBlock {...props} />,
    defaultValue: {
      flexTeasers: [
        {
          alignment: { i: nanoid(), x: 0, y: 0, w: 3, h: 6, static: false },
          teaser: null,
        },
        {
          alignment: { i: nanoid(), x: 3, y: 0, w: 5, h: 3, static: false },
          teaser: null,
        },
        {
          alignment: { i: nanoid(), x: 3, y: 3, w: 5, h: 3, static: false },
          teaser: null,
        },
        {
          alignment: { i: nanoid(), x: 8, y: 0, w: 4, h: 6, static: false },
          teaser: null,
        },
      ],
      blockStyle: undefined,
    },
    label: 'blocks.teaserFlexGrid.label',
    icon: <MdViewQuilt />,
  },

  [EditorBlockType.Html]: {
    field: props => <HTMLBlock {...props} />,
    defaultValue: { html: '', blockStyle: undefined },
    label: 'blocks.html.label',
    icon: <MdCode />,
  },

  [EditorBlockType.Subscribe]: {
    field: props => <SubscribeBlock {...props} />,
    defaultValue: {
      blockStyle: undefined,
      memberPlanIds: [],
      fields: [
        SubscribeBlockField.FirstName,
        SubscribeBlockField.Password,
        SubscribeBlockField.PasswordRepeated,
        SubscribeBlockField.Address,
      ],
    },
    label: 'blocks.subscribe.label',
    icon: <MdAccountBox />,
  },

  [EditorBlockType.Poll]: {
    field: props => <PollBlock {...props} />,
    defaultValue: { poll: null, blockStyle: undefined },
    label: 'blocks.poll.label',
    icon: <MdQueryStats />,
  },

  [EditorBlockType.Crowdfunding]: {
    field: props => <CrowdfundingBlock {...props} />,
    defaultValue: { crowdfunding: null, blockStyle: undefined },
    label: 'blocks.crowdfunding.label',
    icon: <MdMoney />,
  },

  [EditorBlockType.Comment]: {
    field: props => <CommentBlock {...props} />,
    defaultValue: { filter: {}, comments: [], blockStyle: undefined },
    label: 'blocks.comment.label',
    icon: <MdComment />,
  },

  [EditorBlockType.Event]: {
    field: props => <EventBlock {...props} />,
    defaultValue: { filter: {}, events: [], blockStyle: undefined },
    label: 'blocks.event.label',
    icon: <MdEvent />,
  },

  [EditorBlockType.FlexBlock]: {
    field: props => <FlexBlock {...props} />,
    defaultValue: {
      blocks: [
        {
          alignment: { i: nanoid(), x: 0, y: 0, w: 3, h: 6, static: false },
          block: null,
        },
      ],
      blockStyle: undefined,
    },
    label: (() => {
      return 'blocks.flexBlock.label';
    })(),
    icon: <MdAccountBox />,
  },
};
