import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  EditorBlockType,
  MailchimpFormOptionsLayout,
  MailchimpInterestGroupsDocument,
  MailchimpListsDocument,
  MailchimpMergeFieldsDocument,
  SyncProviderSettingsDocument,
} from '@wepublish/editor/api';
import { SetStateAction, useState } from 'react';

import { BlockMap } from './blockMap';
import { MailchimpFormBlock } from './mailchimpFormBlock';
import {
  MailchimpFormBlockValue,
  MailchimpFormFieldConfigValue,
  MailchimpFormInterestOptionValue,
} from './types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const anyVariables = {
  variableMatcher: () => true,
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const mocks: MockedResponse[] = [
  {
    request: { query: SyncProviderSettingsDocument },
    ...anyVariables,
    result: { data: { syncProviderSettings: [] } },
  },
  {
    request: { query: MailchimpListsDocument },
    ...anyVariables,
    result: {
      data: {
        mailchimpLists: [
          {
            __typename: 'MailchimpList',
            id: 'list-daily',
            name: 'Daily Briefing',
            memberCount: 10,
          },
          {
            __typename: 'MailchimpList',
            id: 'list-weekly',
            name: 'Weekly Culture',
            memberCount: 5,
          },
        ],
      },
    },
  },
  {
    request: { query: MailchimpMergeFieldsDocument },
    ...anyVariables,
    result: { data: { mailchimpMergeFields: [] } },
  },
  {
    request: { query: MailchimpInterestGroupsDocument },
    ...anyVariables,
    result: {
      data: {
        mailchimpInterestGroups: [
          {
            __typename: 'MailchimpInterestGroup',
            id: 'interest-daily',
            name: 'Daily Briefing',
          },
          {
            __typename: 'MailchimpInterestGroup',
            id: 'interest-weekly',
            name: 'Weekly Culture',
          },
        ],
      },
    },
  },
];

const defaultValue = BlockMap[EditorBlockType.MailchimpForm]
  .defaultValue as MailchimpFormBlockValue;

const renderBlock = (value: Partial<MailchimpFormBlockValue> = {}) => {
  const latest: { value: MailchimpFormBlockValue } = {
    value: { ...defaultValue, syncProviderId: 'provider', ...value },
  };

  function Harness() {
    const [state, setState] = useState(latest.value);

    return (
      <MailchimpFormBlock
        value={state}
        onChange={(update: SetStateAction<MailchimpFormBlockValue>) =>
          setState(current => {
            latest.value =
              typeof update === 'function' ? update(current) : update;

            return latest.value;
          })
        }
      />
    );
  }

  render(
    <MockedProvider mocks={mocks}>
      <Harness />
    </MockedProvider>
  );

  return latest;
};

const waitForQueries = () =>
  act(() => new Promise(resolve => setTimeout(resolve, 0)));

const openPicker = async (field: HTMLElement) => {
  await waitForQueries();

  await act(async () => {
    fireEvent.click(within(field).getByRole('combobox'));
  });
};

const groupsInput = (
  input: Partial<MailchimpFormFieldConfigValue> = {}
): MailchimpFormFieldConfigValue => ({
  inputType: 'groups',
  name: null,
  label: 'Newsletters',
  description: null,
  required: false,
  urlParam: null,
  defaultValue: null,
  value: null,
  optionsLayout: MailchimpFormOptionsLayout.List,
  options: [],
  ...input,
});

const renderWithGroupsInput = (
  input: Partial<MailchimpFormFieldConfigValue> = {},
  block: Partial<MailchimpFormBlockValue> = {}
) =>
  renderBlock({
    listId: 'list-daily',
    steps: [
      {
        skipIfFieldsFilled: [],
        skipIfInterestsFilled: [],
        showIfInterestsFilled: [],
        inputs: [groupsInput(input)],
      },
    ],
    ...block,
  });

const getOptions = (value: MailchimpFormBlockValue) =>
  value.steps[0].inputs[0].options;

const emptyOption: MailchimpFormInterestOptionValue = {
  id: '',
  name: '',
  description: null,
  image: null,
};

describe('MailchimpFormBlock', () => {
  it('should default to the list layout for new inputs', () => {
    expect(defaultValue).not.toHaveProperty('multipleLists');
    expect(defaultValue).not.toHaveProperty('lists');
    expect(defaultValue.steps[0].inputs[0].optionsLayout).toBe(
      MailchimpFormOptionsLayout.List
    );
  });

  it('should not offer selecting multiple lists', () => {
    renderBlock();

    expect(screen.queryByText('blocks.mailchimpForm.multipleLists')).toBeNull();
    expect(screen.queryByText('blocks.mailchimpForm.lists')).toBeNull();
    expect(screen.queryByText('blocks.mailchimpForm.addList')).toBeNull();
  });

  it('should only show the layout for groups inputs', () => {
    renderBlock();

    expect(screen.queryByText('blocks.mailchimpForm.optionsLayout')).toBeNull();
  });

  it('should switch the layout between list and grid', () => {
    const latest = renderWithGroupsInput();

    fireEvent.click(
      screen.getByLabelText('blocks.mailchimpForm.optionsLayoutGrid')
    );
    expect(latest.value.steps[0].inputs[0].optionsLayout).toBe(
      MailchimpFormOptionsLayout.Grid
    );

    fireEvent.click(
      screen.getByLabelText('blocks.mailchimpForm.optionsLayoutList')
    );
    expect(latest.value.steps[0].inputs[0].optionsLayout).toBe(
      MailchimpFormOptionsLayout.List
    );
  });

  it('should add, edit and remove interest options', () => {
    const latest = renderWithGroupsInput();

    fireEvent.click(screen.getByText('blocks.mailchimpForm.addInterestOption'));
    fireEvent.click(screen.getByText('blocks.mailchimpForm.addInterestOption'));

    expect(getOptions(latest.value)).toEqual([emptyOption, emptyOption]);

    const [firstName, secondName] = screen.getAllByText(
      'blocks.mailchimpForm.interestOptionName'
    );
    fireEvent.change(firstName.parentElement!.querySelector('input')!, {
      target: { value: 'Daily Briefing' },
    });
    fireEvent.change(secondName.parentElement!.querySelector('input')!, {
      target: { value: 'Weekly Culture' },
    });

    const [firstDescription] = screen.getAllByText(
      'blocks.mailchimpForm.interestOptionDescription'
    );
    fireEvent.change(
      firstDescription.parentElement!.querySelector('textarea')!,
      {
        target: { value: 'Every morning' },
      }
    );

    expect(getOptions(latest.value)).toMatchObject([
      { name: 'Daily Briefing', description: 'Every morning' },
      { name: 'Weekly Culture', description: null },
    ]);

    const firstItem = screen.getByText('Daily Briefing').closest('.rs-panel')!;
    fireEvent.click(within(firstItem as HTMLElement).getAllByRole('button')[0]);

    expect(getOptions(latest.value)).toMatchObject([
      { name: 'Weekly Culture' },
    ]);
  });

  it('should prefill the name with the name of the picked interest', async () => {
    const latest = renderWithGroupsInput({ options: [emptyOption] });

    const itemPicker = screen.getByText(
      'blocks.mailchimpForm.interestOption'
    ).parentElement!;

    await openPicker(itemPicker);

    fireEvent.click(
      await screen.findByRole('option', { name: 'Weekly Culture' })
    );

    await waitFor(() =>
      expect(getOptions(latest.value)).toMatchObject([
        { id: 'interest-weekly', name: 'Weekly Culture' },
      ])
    );
  });

  it('should not overwrite a custom name when picking an interest', async () => {
    const latest = renderWithGroupsInput({
      options: [{ ...emptyOption, name: 'My newsletter' }],
    });

    const itemPicker = screen.getByText(
      'blocks.mailchimpForm.interestOption'
    ).parentElement!;

    await openPicker(itemPicker);

    fireEvent.click(
      await screen.findByRole('option', { name: 'Daily Briefing' })
    );

    await waitFor(() =>
      expect(getOptions(latest.value)).toMatchObject([
        { id: 'interest-daily', name: 'My newsletter' },
      ])
    );
  });

  it('should explain what a groups input is for', () => {
    renderWithGroupsInput();

    expect(
      screen.getByText('blocks.mailchimpForm.inputTypeGroupsHelp')
    ).toBeTruthy();
    expect(
      screen.getByText('blocks.mailchimpForm.inputLabelGroupsHelp')
    ).toBeTruthy();
    expect(screen.queryByText('blocks.mailchimpForm.inputName')).toBeNull();
    expect(
      screen.queryByText('blocks.mailchimpForm.interestOptionsNoList')
    ).toBeNull();
  });

  it('should label the input types in a readable way', () => {
    renderWithGroupsInput();

    expect(
      screen.getByText('blocks.mailchimpForm.inputTypes.groups')
    ).toBeTruthy();
  });

  it('should hint to select a list before interests can be picked', () => {
    renderWithGroupsInput({}, { listId: null });

    expect(
      screen.getByText('blocks.mailchimpForm.interestOptionsNoList')
    ).toBeTruthy();
  });
});
