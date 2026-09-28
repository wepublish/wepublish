import {
  EditorBlockType,
  FullBlockFragment,
  FullImageFragment,
  MailchimpFormListsLayout,
} from '@wepublish/editor/api';

import {
  blockForQueryBlock,
  MailchimpFormBlockListValue,
  MailchimpFormBlockValue,
  mapBlockValueToBlockInput,
} from './types';

const image = { id: 'image-1' } as FullImageFragment;

const queryBlock = (block: Record<string, unknown> = {}): FullBlockFragment =>
  ({
    __typename: 'MailchimpFormBlock',
    disabled: false,
    blockStyle: null,
    blockStyleName: null,
    syncProviderId: 'provider',
    listId: 'list-daily',
    interests: [],
    multipleLists: true,
    listsLayout: MailchimpFormListsLayout.Grid,
    lists: [
      {
        __typename: 'MailchimpFormList',
        listId: 'list-daily',
        name: 'Daily Briefing',
        description: 'Every morning',
        image,
      },
      {
        __typename: 'MailchimpFormList',
        listId: 'list-weekly',
        name: 'Weekly Culture',
        description: null,
        image: null,
      },
    ],
    autoFocus: true,
    doubleOptIn: true,
    buttonColor: null,
    buttonFontColor: null,
    submitButtonLabel: null,
    successUrl: null,
    steps: [],
    successPage: null,
    ...block,
  }) as unknown as FullBlockFragment;

const editorBlock = (
  value: Partial<MailchimpFormBlockValue> = {}
): MailchimpFormBlockListValue => ({
  key: 'key',
  type: EditorBlockType.MailchimpForm,
  value: {
    syncProviderId: 'provider',
    listId: 'list-daily',
    interests: [],
    multipleLists: false,
    listsLayout: MailchimpFormListsLayout.List,
    lists: [],
    autoFocus: true,
    steps: [],
    ...value,
  },
});

describe('Mailchimp form block mapping', () => {
  describe('blockForQueryBlock', () => {
    it('should map the multiple lists configuration', () => {
      const block = blockForQueryBlock(queryBlock());

      expect(block.type).toBe(EditorBlockType.MailchimpForm);
      expect(block.value).toMatchObject({
        multipleLists: true,
        listsLayout: MailchimpFormListsLayout.Grid,
        lists: [
          {
            listId: 'list-daily',
            name: 'Daily Briefing',
            description: 'Every morning',
            image,
          },
          {
            listId: 'list-weekly',
            name: 'Weekly Culture',
            description: null,
            image: null,
          },
        ],
      });
    });

    it('should fall back to a single list for blocks saved before multiple lists existed', () => {
      const block = blockForQueryBlock(
        queryBlock({
          multipleLists: undefined,
          listsLayout: undefined,
          lists: undefined,
        })
      );

      expect(block.value).toMatchObject({
        multipleLists: false,
        listsLayout: MailchimpFormListsLayout.List,
        lists: [],
      });
    });
  });

  describe('mapBlockValueToBlockInput', () => {
    it('should map lists to inputs with image ids', () => {
      const input = mapBlockValueToBlockInput(
        editorBlock({
          multipleLists: true,
          listsLayout: MailchimpFormListsLayout.Grid,
          lists: [
            {
              listId: 'list-daily',
              name: 'Daily Briefing',
              description: 'Every morning',
              image,
            },
            {
              listId: 'list-weekly',
              name: 'Weekly Culture',
              description: null,
              image: null,
            },
          ],
        })
      );

      expect(input.mailchimpForm).toMatchObject({
        multipleLists: true,
        listsLayout: MailchimpFormListsLayout.Grid,
        lists: [
          {
            listId: 'list-daily',
            name: 'Daily Briefing',
            description: 'Every morning',
            imageID: 'image-1',
          },
          {
            listId: 'list-weekly',
            name: 'Weekly Culture',
            description: null,
            imageID: undefined,
          },
        ],
      });
      expect(input.mailchimpForm?.lists).to.toHaveLength(2);
      expect(input.mailchimpForm?.lists?.[0]).not.toHaveProperty('image');
    });

    it('should keep lists when multiple lists is disabled', () => {
      const input = mapBlockValueToBlockInput(
        editorBlock({
          multipleLists: false,
          lists: [{ listId: 'list-daily', name: 'Daily Briefing' }],
        })
      );

      expect(input.mailchimpForm).toMatchObject({
        multipleLists: false,
        lists: [{ listId: 'list-daily', name: 'Daily Briefing' }],
      });
    });

    it('should survive a round trip', () => {
      const value = blockForQueryBlock(queryBlock());
      const input = mapBlockValueToBlockInput(value);

      expect(input.mailchimpForm).toMatchObject({
        multipleLists: true,
        listsLayout: MailchimpFormListsLayout.Grid,
        lists: [
          { listId: 'list-daily', imageID: 'image-1' },
          { listId: 'list-weekly', imageID: undefined },
        ],
      });
    });
  });
});
