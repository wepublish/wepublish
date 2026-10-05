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

import {
  AggregatedValidation,
  EditorValidationProvider,
} from '../hooks/useEditorValidation';
import { BlockMap } from './blockMap';
import { MailchimpFormBlock } from './mailchimpFormBlock';
import {
  MailchimpFormBlockValue,
  MailchimpFormFieldConfigValue,
  MailchimpFormInterestOptionValue,
} from './types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number?: number }) =>
      options?.number ? `${key} ${options.number}` : key,
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
  const runAllRef = {
    current: (): AggregatedValidation => ({ ok: true, failures: [] }),
  };
  const latest: {
    value: MailchimpFormBlockValue;
    validate: () => AggregatedValidation;
  } = {
    value: { ...defaultValue, syncProviderId: 'provider', ...value },
    validate: () => runAllRef.current(),
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
      <EditorValidationProvider runAllRef={runAllRef}>
        <Harness />
      </EditorValidationProvider>
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

const textInput = (label: string): MailchimpFormFieldConfigValue => ({
  ...groupsInput(),
  inputType: 'text',
  label,
});

const step = (inputs: MailchimpFormFieldConfigValue[]) => ({
  skipIfFieldsFilled: [],
  skipIfInterestsFilled: [],
  showIfInterestsFilled: [],
  inputs,
});

const itemHeader = (heading: string) =>
  screen.getByText(heading).parentElement!;

const itemPanel = (heading: string) =>
  screen.getByText(heading).closest('.rs-panel') as HTMLElement;

const stepHeader = (index: number) =>
  screen.getByText(`blocks.mailchimpForm.step ${index + 1}`).parentElement!;

const stepPanel = (index: number) =>
  stepHeader(index).closest('.rs-panel') as HTMLElement;

const moveUp = (header: HTMLElement) =>
  within(header).getByLabelText('blocks.mailchimpForm.moveUp');

const moveDown = (header: HTMLElement) =>
  within(header).getByLabelText('blocks.mailchimpForm.moveDown');

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

    fireEvent.click(
      within(itemHeader('Daily Briefing')).getByLabelText(
        'blocks.mailchimpForm.remove'
      )
    );

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

  it('should update a prefilled name when picking a different interest', async () => {
    const latest = renderWithGroupsInput({
      options: [
        { ...emptyOption, id: 'interest-daily', name: 'Daily Briefing' },
      ],
    });

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

  it('should keep a custom name when picking a different interest', async () => {
    const latest = renderWithGroupsInput({
      options: [
        { ...emptyOption, id: 'interest-daily', name: 'My newsletter' },
      ],
    });

    const itemPicker = screen.getByText(
      'blocks.mailchimpForm.interestOption'
    ).parentElement!;

    await openPicker(itemPicker);

    fireEvent.click(
      await screen.findByRole('option', { name: 'Weekly Culture' })
    );

    await waitFor(() =>
      expect(getOptions(latest.value)).toMatchObject([
        { id: 'interest-weekly', name: 'My newsletter' },
      ])
    );
  });

  it('should number the titles of items without a name', () => {
    const successOption = {
      background: '#ff8900',
      url: 'https://example.com',
      mergeFieldName: null,
      mergeFieldValue: null,
    };

    renderWithGroupsInput(
      {
        label: null,
        options: [
          { ...emptyOption, id: 'interest-daily', name: 'Daily Briefing' },
          emptyOption,
        ],
      },
      {
        successPage: {
          description: '',
          options: [
            { ...successOption, label: 'Read more' },
            { ...successOption, label: '' },
          ],
        },
      }
    );

    expect(screen.getByText('blocks.mailchimpForm.inputTitle 1')).toBeTruthy();
    expect(
      screen.getByText('blocks.mailchimpForm.interestOptionTitle 2')
    ).toBeTruthy();
    expect(
      screen.queryByText('blocks.mailchimpForm.interestOptionTitle 1')
    ).toBeNull();
    expect(
      screen.getByText('blocks.mailchimpForm.successOptionTitle 2')
    ).toBeTruthy();
    expect(
      screen.queryByText('blocks.mailchimpForm.successOptionTitle 1')
    ).toBeNull();
  });

  it('should hide the step conditions behind the advanced toggle', () => {
    renderBlock();

    expect(
      screen.queryByText('blocks.mailchimpForm.skipIfFieldsFilled')
    ).toBeNull();

    const [stepAdvanced] = screen.getAllByText('blocks.mailchimpForm.advanced');

    fireEvent.click(within(stepAdvanced.parentElement!).getByRole('switch'));

    expect(
      screen.getByText('blocks.mailchimpForm.skipIfFieldsFilled')
    ).toBeTruthy();
    expect(
      screen.getByText('blocks.mailchimpForm.skipIfInterestsFilled')
    ).toBeTruthy();
    expect(
      screen.getByText('blocks.mailchimpForm.showIfInterestsFilled')
    ).toBeTruthy();
  });

  it('should show the step conditions if the step already has conditions', () => {
    renderWithGroupsInput(
      {},
      {
        steps: [
          {
            skipIfFieldsFilled: ['FNAME'],
            skipIfInterestsFilled: [],
            showIfInterestsFilled: [],
            inputs: [groupsInput()],
          },
        ],
      }
    );

    expect(
      screen.getByText('blocks.mailchimpForm.skipIfFieldsFilled')
    ).toBeTruthy();
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

  it('should reorder steps', () => {
    const latest = renderBlock({
      steps: [step([textInput('Input A')]), step([textInput('Input B')])],
    });

    expect(
      within(stepHeader(0)).queryByLabelText('blocks.mailchimpForm.moveUp')
    ).toBeNull();
    expect(
      within(stepHeader(1)).queryByLabelText('blocks.mailchimpForm.moveDown')
    ).toBeNull();

    fireEvent.click(moveDown(stepHeader(0)));
    expect(latest.value.steps.map(({ inputs }) => inputs[0].label)).toEqual([
      'Input B',
      'Input A',
    ]);

    fireEvent.click(moveUp(stepHeader(1)));
    expect(latest.value.steps.map(({ inputs }) => inputs[0].label)).toEqual([
      'Input A',
      'Input B',
    ]);
  });

  it('should reorder inputs within a step', () => {
    const latest = renderBlock({
      steps: [
        step([
          textInput('Input A'),
          textInput('Input B'),
          textInput('Input C'),
        ]),
      ],
    });
    const labels = () => latest.value.steps[0].inputs.map(({ label }) => label);

    expect(
      within(itemHeader('Input A')).queryByLabelText(
        'blocks.mailchimpForm.moveUp'
      )
    ).toBeNull();
    expect(
      within(itemHeader('Input C')).queryByLabelText(
        'blocks.mailchimpForm.moveDown'
      )
    ).toBeNull();

    fireEvent.click(moveUp(itemHeader('Input B')));
    expect(labels()).toEqual(['Input B', 'Input A', 'Input C']);

    fireEvent.click(moveDown(itemHeader('Input B')));
    expect(labels()).toEqual(['Input A', 'Input B', 'Input C']);
  });

  it('should keep the advanced settings open on the moved input', () => {
    renderBlock({
      steps: [step([textInput('Input A'), textInput('Input B')])],
    });

    fireEvent.click(
      within(itemPanel('Input A'))
        .getByText('blocks.mailchimpForm.advanced')
        .parentElement!.querySelector('input')!
    );
    expect(
      within(itemPanel('Input A')).queryByText(
        'blocks.mailchimpForm.inputDescription'
      )
    ).toBeTruthy();

    fireEvent.click(moveDown(itemHeader('Input A')));

    expect(
      within(itemPanel('Input A')).queryByText(
        'blocks.mailchimpForm.inputDescription'
      )
    ).toBeTruthy();
    expect(
      within(itemPanel('Input B')).queryByText(
        'blocks.mailchimpForm.inputDescription'
      )
    ).toBeNull();
  });

  it('should keep the advanced settings open on inputs of a moved step', () => {
    renderBlock({
      steps: [step([textInput('Input A')]), step([textInput('Input B')])],
    });

    fireEvent.click(
      within(itemPanel('Input A'))
        .getByText('blocks.mailchimpForm.advanced')
        .parentElement!.querySelector('input')!
    );
    fireEvent.click(moveDown(stepHeader(0)));

    expect(
      within(itemPanel('Input A')).queryByText(
        'blocks.mailchimpForm.inputDescription'
      )
    ).toBeTruthy();
    expect(
      within(itemPanel('Input B')).queryByText(
        'blocks.mailchimpForm.inputDescription'
      )
    ).toBeNull();
  });

  it('should keep the step conditions open on a moved step', () => {
    renderBlock({
      steps: [step([textInput('Input A')]), step([textInput('Input B')])],
    });

    const [stepAdvanced] = within(stepPanel(0)).getAllByText(
      'blocks.mailchimpForm.advanced'
    );

    fireEvent.click(within(stepAdvanced.parentElement!).getByRole('switch'));
    fireEvent.click(moveDown(stepHeader(0)));

    expect(
      within(stepPanel(1)).queryByText(
        'blocks.mailchimpForm.skipIfFieldsFilled'
      )
    ).toBeTruthy();
    expect(
      within(stepPanel(0)).queryByText(
        'blocks.mailchimpForm.skipIfFieldsFilled'
      )
    ).toBeNull();
  });

  it('should reorder interest options', () => {
    const latest = renderWithGroupsInput({
      options: [
        { ...emptyOption, name: 'Option A' },
        { ...emptyOption, name: 'Option B' },
        { ...emptyOption, name: 'Option C' },
      ],
    });
    const names = () => getOptions(latest.value).map(({ name }) => name);

    expect(
      within(itemHeader('Option A')).queryByLabelText(
        'blocks.mailchimpForm.moveUp'
      )
    ).toBeNull();
    expect(
      within(itemHeader('Option C')).queryByLabelText(
        'blocks.mailchimpForm.moveDown'
      )
    ).toBeNull();

    fireEvent.click(moveUp(itemHeader('Option B')));
    expect(names()).toEqual(['Option B', 'Option A', 'Option C']);

    fireEvent.click(moveDown(itemHeader('Option B')));
    expect(names()).toEqual(['Option A', 'Option B', 'Option C']);
  });

  it('should hint to select a list before interests can be picked', () => {
    renderWithGroupsInput({}, { listId: null });

    expect(
      screen.getByText('blocks.mailchimpForm.interestOptionsNoList')
    ).toBeTruthy();
  });

  describe('validation', () => {
    const emailInput = defaultValue.steps[0].inputs[0];

    const validate = (latest: { validate: () => AggregatedValidation }) => {
      let result: AggregatedValidation | undefined;

      act(() => {
        result = latest.validate();
      });

      return result!;
    };

    const stepWith = (...inputs: MailchimpFormFieldConfigValue[]) => ({
      skipIfFieldsFilled: [],
      skipIfInterestsFilled: [],
      showIfInterestsFilled: [],
      inputs,
    });

    it('should allow saving a complete form', () => {
      const latest = renderBlock({ listId: 'list-daily' });

      expect(validate(latest)).toEqual({ ok: true, failures: [] });
    });

    it('should prevent saving a text input without merge field and label', () => {
      const latest = renderBlock({
        listId: 'list-daily',
        steps: [
          stepWith(emailInput, {
            ...emailInput,
            inputType: 'text',
            name: '',
            label: '',
          }),
        ],
      });

      expect(
        screen.queryByText('blocks.mailchimpForm.inputNameRequired')
      ).toBeNull();

      expect(validate(latest)).toMatchObject({
        ok: false,
        failures: [{ summary: 'blocks.mailchimpForm.validationSummaryMany' }],
      });
      expect(
        screen.getByText('blocks.mailchimpForm.inputNameRequired')
      ).toBeTruthy();
      expect(
        screen.getByText('blocks.mailchimpForm.inputLabelRequired')
      ).toBeTruthy();
    });

    it('should not require a label for hidden inputs', () => {
      const latest = renderBlock({
        listId: 'list-daily',
        steps: [
          stepWith(emailInput, {
            ...emailInput,
            inputType: 'hidden',
            name: 'SOURCE',
            label: '',
          }),
        ],
      });

      expect(validate(latest).ok).toBe(true);
    });

    it('should prevent saving without account, list and email input', () => {
      const latest = renderBlock({
        syncProviderId: null,
        listId: null,
        steps: [
          stepWith(
            groupsInput({
              options: [{ ...emptyOption, id: 'interest-daily' }],
            })
          ),
        ],
      });

      expect(validate(latest)).toMatchObject({
        ok: false,
        failures: [{ summary: 'blocks.mailchimpForm.validationSummaryMany' }],
      });
      expect(
        screen.getByText('blocks.mailchimpForm.syncProviderRequired')
      ).toBeTruthy();
      expect(
        screen.getByText('blocks.mailchimpForm.listRequired')
      ).toBeTruthy();
      expect(
        screen.getByText('blocks.mailchimpForm.emailInputRequired')
      ).toBeTruthy();
    });

    it('should prevent saving an interest selection without options', () => {
      const latest = renderBlock({
        listId: 'list-daily',
        steps: [stepWith(emailInput, groupsInput({ options: [] }))],
      });

      expect(validate(latest)).toMatchObject({
        ok: false,
        failures: [{ summary: 'blocks.mailchimpForm.validationSummaryOne' }],
      });
      expect(
        screen.getByText('blocks.mailchimpForm.interestOptionsRequired')
      ).toBeTruthy();
    });

    it('should prevent saving an interest option without an interest', () => {
      const latest = renderBlock({
        listId: 'list-daily',
        steps: [
          stepWith(
            emailInput,
            groupsInput({
              options: [
                { ...emptyOption, name: 'My newsletter' },
                {
                  ...emptyOption,
                  id: 'interest-daily',
                  name: 'Daily Briefing',
                },
              ],
            })
          ),
        ],
      });

      expect(
        screen.queryByText('blocks.mailchimpForm.interestOptionRequired')
      ).toBeNull();

      expect(validate(latest)).toMatchObject({
        ok: false,
        failures: [{ summary: 'blocks.mailchimpForm.validationSummaryOne' }],
      });
      expect(
        screen.getAllByText('blocks.mailchimpForm.interestOptionRequired')
      ).toHaveLength(1);
      expect(
        screen.queryByText('blocks.mailchimpForm.interestOptionsRequired')
      ).toBeNull();
    });

    it('should not validate a hidden block', () => {
      const latest = renderBlock({ disabled: true, listId: null });

      expect(validate(latest).ok).toBe(true);
      expect(
        screen.queryByText('blocks.mailchimpForm.listRequired')
      ).toBeNull();
    });
  });
});
