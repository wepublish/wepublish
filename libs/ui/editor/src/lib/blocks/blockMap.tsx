import {
  EditorBlockType,
  MailchimpFormOptionsLayout,
  SubscribeBlockField,
  TeaserListBlockSort,
  TeaserSlotType,
  TeaserType,
} from '@wepublish/editor/api';
import nanoid from 'nanoid';
import {
  MdAccountBox,
  MdCode,
  MdCoffee,
  MdComment,
  MdEvent,
  MdFileCopy,
  MdFilter,
  MdFilter1,
  MdFilter6,
  MdFilter9Plus,
  MdFormatColorText,
  MdFormatQuote,
  MdIntegrationInstructions,
  MdInterests,
  MdMarkEmailRead,
  MdMoney,
  MdPhoto,
  MdPhotoLibrary,
  MdPerson,
  MdQueryStats,
  MdTitle,
  MdViewList,
  MdViewQuilt,
} from 'react-icons/md';

import { BlockMapForValue } from '../atoms/blockList';
import { isFunctionalUpdate } from '../utility';
import { BlockTemplateBlock } from './blockTemplateBlock';
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
import { MailchimpFormBlock } from './mailchimpFormBlock';
import { AuthorBlock } from './authorBlock';
import { PollBlock } from './pollBlock';
import { QuoteBlock } from './quoteBlock';
import { RichTextBlock } from './richTextBlock/rich-text-block';
import { SubscribeBlock } from './subscribeBlock';
import { TeaserGridBlock } from './teaserGridBlock';
import { TeaserGridFlexBlock } from './teaserGridFlexBlock';
import { TeaserListBlock } from './teaserListBlock';
import { TeaserSlotsBlock } from './teaserSlotsBlock';
import { TitleBlock } from './titleBlock';
import { BlockValue, EmbedType } from './types';

export const BlockMap: BlockMapForValue<BlockValue> = {
  [EditorBlockType.Title]: {
    group: 'text',
    field: props => <TitleBlock {...props} />,
    defaultValue: { title: '', lead: '', preTitle: '', blockStyle: undefined },
    label: 'blocks.title.label',
    icon: <MdTitle />,
  },

  [EditorBlockType.RichText]: {
    group: 'text',
    bare: true,
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
      richText: undefined,
    },
    label: 'blocks.richText.label',
    icon: <MdFormatColorText />,
  },

  [EditorBlockType.Image]: {
    group: 'media',
    field: props => <ImageBlock {...props} />,
    defaultValue: { image: null, caption: '', blockStyle: undefined },
    label: 'blocks.image.label',
    icon: <MdPhoto />,
  },

  [EditorBlockType.ImageGallery]: {
    group: 'media',
    field: props => <ImageGalleryBlock {...props} />,
    defaultValue: {
      images: [{ caption: '', image: null }],
      blockStyle: undefined,
    },
    label: 'blocks.imageGallery.label',
    icon: <MdPhotoLibrary />,
  },

  [EditorBlockType.Listicle]: {
    group: 'text',
    field: props => <ListicleBlock {...props} />,
    defaultValue: {
      items: [
        {
          id: nanoid(),
          value: {
            image: null,
            title: '',
            richText: undefined,
          },
        },
      ],
      blockStyle: undefined,
    },
    label: 'blocks.listicle.label',
    icon: <MdViewList />,
  },

  [EditorBlockType.Quote]: {
    group: 'text',
    field: props => <QuoteBlock {...props} />,
    defaultValue: { quote: '', author: '', image: null, blockStyle: undefined },
    label: 'blocks.quote.label',
    icon: <MdFormatQuote />,
  },

  [EditorBlockType.LinkPageBreak]: {
    group: 'layout',
    field: props => <LinkPageBreakBlock {...props} />,
    defaultValue: {
      text: '',
      linkText: '',
      linkTarget: '',
      linkURL: '',
      richText: undefined,
      image: undefined,
      hideButton: false,
      blockStyle: undefined,
    },
    label: 'blocks.linkPageBreak.label',
    icon: <MdCoffee />,
  },

  [EditorBlockType.Embed]: {
    group: 'media',
    field: props => <EmbedBlock {...props} />,
    defaultValue: { type: EmbedType.Other, blockStyle: undefined },
    label: 'blocks.embeds.label',
    icon: <MdIntegrationInstructions />,
  },

  [EditorBlockType.TeaserList]: {
    group: 'teasers',
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
    group: 'teasers',
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
    group: 'teasers',
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
    group: 'teasers',
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
    group: 'teasers',
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
    group: 'text',
    field: props => <HTMLBlock {...props} />,
    defaultValue: { html: '', blockStyle: undefined },
    label: 'blocks.html.label',
    icon: <MdCode />,
  },

  [EditorBlockType.Subscribe]: {
    group: 'interaction',
    field: props => <SubscribeBlock {...props} />,
    defaultValue: {
      blockStyle: undefined,
      memberPlanIds: [],
      periodicityDisplay: null,
      memberPlanRenderSettings: [],
      fields: [
        SubscribeBlockField.FirstName,
        SubscribeBlockField.Password,
        SubscribeBlockField.PasswordRepeated,
        SubscribeBlockField.Address,
      ],
      showGoodies: false,
      showDiscountCodes: false,
      goodieMinValue: null,
      goodieMinValueAppliesToUpgrade: false,
      hideRepeatGoodieOnUpgrade: false,
    },
    label: 'blocks.subscribe.label',
    icon: <MdAccountBox />,
  },

  [EditorBlockType.MailchimpForm]: {
    group: 'interaction',
    field: props => <MailchimpFormBlock {...props} />,
    defaultValue: {
      blockStyle: undefined,
      syncProviderId: null,
      listId: null,
      interests: [],
      autoFocus: true,
      doubleOptIn: true,
      buttonColor: '#ffd60a',
      buttonFontColor: '#000000',
      submitButtonLabel: '',
      steps: [
        {
          skipIfFieldsFilled: [],
          skipIfInterestsFilled: [],
          showIfInterestsFilled: [],
          inputs: [
            {
              inputType: 'email',
              name: 'EMAIL',
              label: 'E-Mail',
              description: null,
              required: true,
              urlParam: 'email',
              defaultValue: null,
              value: null,
              optionsLayout: MailchimpFormOptionsLayout.List,
              options: [],
            },
          ],
        },
      ],
      successUrl: '',
      successPage: null,
    },
    label: 'blocks.mailchimpForm.label',
    icon: <MdMarkEmailRead />,
  },

  [EditorBlockType.Poll]: {
    group: 'interaction',
    field: props => <PollBlock {...props} />,
    defaultValue: { poll: null, blockStyle: undefined },
    label: 'blocks.poll.label',
    icon: <MdQueryStats />,
  },

  [EditorBlockType.Author]: {
    group: 'teasers',
    field: props => <AuthorBlock {...props} />,
    defaultValue: { author: null, blockStyle: undefined },
    label: 'blocks.author.label',
    icon: <MdPerson />,
  },

  [EditorBlockType.Crowdfunding]: {
    group: 'interaction',
    field: props => <CrowdfundingBlock {...props} />,
    defaultValue: { crowdfunding: null, blockStyle: undefined },
    label: 'blocks.crowdfunding.label',
    icon: <MdMoney />,
  },

  [EditorBlockType.Comment]: {
    group: 'interaction',
    field: props => <CommentBlock {...props} />,
    defaultValue: { filter: {}, comments: [], blockStyle: undefined },
    label: 'blocks.comment.label',
    icon: <MdComment />,
  },

  [EditorBlockType.Event]: {
    group: 'interaction',
    field: props => <EventBlock {...props} />,
    defaultValue: { filter: {}, events: [], blockStyle: undefined },
    label: 'blocks.event.label',
    icon: <MdEvent />,
  },

  [EditorBlockType.FlexBlock]: {
    group: 'layout',
    field: props => <FlexBlock {...props} />,
    defaultValue: {
      blocks: [
        {
          alignment: {
            __typename: 'FlexAlignment',
            i: nanoid(),
            x: 0,
            y: 0,
            w: 3,
            h: 6,
          },
          block: null,
        },
      ],
      blockStyle: undefined,
    },
    label: (() => {
      return 'blocks.flexBlock.label';
    })(),
    icon: <MdInterests />,
  },

  [EditorBlockType.BlockTemplate]: {
    group: 'layout',
    field: props => <BlockTemplateBlock {...props} />,
    defaultValue: { template: null, blockStyle: undefined },
    label: 'blocks.blockTemplate.label',
    icon: <MdFileCopy />,
  },
};
