import {
  EditorBlockType,
  FullBlockFragment,
  FullImageFragment,
  MailchimpFormOptionsLayout,
} from '@wepublish/editor/api';

import {
  blockForQueryBlock,
  MailchimpFormBlockListValue,
  MailchimpFormBlockValue,
  MailchimpFormFieldConfigValue,
  mapBlockValueToBlockInput,
} from './types';

const image = { id: 'image-1' } as FullImageFragment;

const queryInput = (input: Record<string, unknown> = {}) => ({
  __typename: 'MailchimpFormFieldConfig',
  inputType: 'groups',
  name: null,
  label: 'Newsletters',
  description: null,
  required: false,
  urlParam: null,
  defaultValue: null,
  value: null,
  optionsLayout: MailchimpFormOptionsLayout.Grid,
  options: [
    {
      __typename: 'MailchimpFormInterestOption',
      id: 'interest-daily',
      name: 'Daily Briefing',
      description: 'Every morning',
      image,
    },
    {
      __typename: 'MailchimpFormInterestOption',
      id: 'interest-weekly',
      name: 'Weekly Culture',
      description: null,
      image: null,
    },
  ],
  ...input,
});

const queryBlock = (input: Record<string, unknown> = {}): FullBlockFragment =>
  ({
    __typename: 'MailchimpFormBlock',
    disabled: false,
    blockStyle: null,
    blockStyleName: null,
    syncProviderId: 'provider',
    listId: 'list-daily',
    interests: [],
    autoFocus: true,
    doubleOptIn: true,
    buttonColor: null,
    buttonFontColor: null,
    submitButtonLabel: null,
    successUrl: null,
    steps: [
      {
        __typename: 'MailchimpFormStep',
        skipIfFieldsFilled: [],
        skipIfInterestsFilled: [],
        showIfInterestsFilled: [],
        inputs: [queryInput(input)],
      },
    ],
    successPage: null,
  }) as unknown as FullBlockFragment;

const editorBlock = (
  input: Partial<MailchimpFormFieldConfigValue> = {}
): MailchimpFormBlockListValue => ({
  key: 'key',
  type: EditorBlockType.MailchimpForm,
  value: {
    syncProviderId: 'provider',
    listId: 'list-daily',
    interests: [],
    autoFocus: true,
    steps: [
      {
        skipIfFieldsFilled: [],
        skipIfInterestsFilled: [],
        showIfInterestsFilled: [],
        inputs: [
          {
            inputType: 'groups',
            optionsLayout: MailchimpFormOptionsLayout.List,
            options: [],
            ...input,
          },
        ],
      },
    ],
  } as MailchimpFormBlockValue,
});

describe('Mailchimp form block mapping', () => {
  describe('blockForQueryBlock', () => {
    it('should map the interest options with layout and images', () => {
      const block = blockForQueryBlock(queryBlock());

      expect(block.type).toBe(EditorBlockType.MailchimpForm);
      expect(
        (block.value as MailchimpFormBlockValue).steps[0].inputs[0]
      ).toMatchObject({
        optionsLayout: MailchimpFormOptionsLayout.Grid,
        options: [
          {
            id: 'interest-daily',
            name: 'Daily Briefing',
            description: 'Every morning',
            image,
          },
          {
            id: 'interest-weekly',
            name: 'Weekly Culture',
            description: null,
            image: null,
          },
        ],
      });
    });

    it('should fall back to the list layout for inputs saved before layouts existed', () => {
      const block = blockForQueryBlock(
        queryBlock({
          optionsLayout: undefined,
          options: [{ id: 'interest-daily', name: 'Daily Briefing' }],
        })
      );

      expect(
        (block.value as MailchimpFormBlockValue).steps[0].inputs[0]
      ).toMatchObject({
        optionsLayout: MailchimpFormOptionsLayout.List,
        options: [
          {
            id: 'interest-daily',
            description: null,
            image: null,
          },
        ],
      });
    });
  });

  describe('mapBlockValueToBlockInput', () => {
    it('should map interest options to inputs with image ids', () => {
      const input = mapBlockValueToBlockInput(
        editorBlock({
          optionsLayout: MailchimpFormOptionsLayout.Grid,
          options: [
            {
              id: 'interest-daily',
              name: 'Daily Briefing',
              description: 'Every morning',
              image,
            },
            {
              id: 'interest-weekly',
              name: 'Weekly Culture',
              description: null,
              image: null,
            },
          ],
        })
      );

      const mappedInput = input.mailchimpForm?.steps?.[0].inputs?.[0];

      expect(mappedInput).toMatchObject({
        optionsLayout: MailchimpFormOptionsLayout.Grid,
        options: [
          {
            id: 'interest-daily',
            name: 'Daily Briefing',
            description: 'Every morning',
            imageID: 'image-1',
          },
          {
            id: 'interest-weekly',
            name: 'Weekly Culture',
            description: null,
            imageID: undefined,
          },
        ],
      });
      expect(mappedInput?.options?.[0]).not.toHaveProperty('image');
    });

    it('should not send interest options without an interest', () => {
      const input = mapBlockValueToBlockInput(
        editorBlock({
          options: [
            { id: '', name: 'Unfinished', description: null, image },
            {
              id: 'interest-weekly',
              name: 'Weekly Culture',
              description: null,
              image: null,
            },
          ],
        })
      );

      expect(input.mailchimpForm?.steps?.[0].inputs?.[0].options).toEqual([
        {
          id: 'interest-weekly',
          name: 'Weekly Culture',
          description: null,
          imageID: undefined,
        },
      ]);
    });

    it('should not send the removed multiple lists fields', () => {
      const input = mapBlockValueToBlockInput(editorBlock());

      expect(input.mailchimpForm).not.toHaveProperty('multipleLists');
      expect(input.mailchimpForm).not.toHaveProperty('listsLayout');
      expect(input.mailchimpForm).not.toHaveProperty('lists');
    });

    it('should survive a round trip', () => {
      const value = blockForQueryBlock(queryBlock());
      const input = mapBlockValueToBlockInput(value);

      expect(input.mailchimpForm?.steps?.[0].inputs?.[0]).toMatchObject({
        optionsLayout: MailchimpFormOptionsLayout.Grid,
        options: [
          { id: 'interest-daily', imageID: 'image-1' },
          { id: 'interest-weekly', imageID: undefined },
        ],
      });
    });
  });
});
