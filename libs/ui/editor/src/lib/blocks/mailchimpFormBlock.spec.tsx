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
  MailchimpFormListsLayout,
  MailchimpInterestGroupsDocument,
  MailchimpListsDocument,
  MailchimpMergeFieldsDocument,
  SyncProviderSettingsDocument,
} from '@wepublish/editor/api';
import { SetStateAction, useState } from 'react';

import { BlockMap } from './blockMap';
import { MailchimpFormBlock } from './mailchimpFormBlock';
import { MailchimpFormBlockValue } from './types';

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
    result: { data: { mailchimpInterestGroups: [] } },
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

const openListPicker = async (field: HTMLElement) => {
  await waitForQueries();

  await act(async () => {
    fireEvent.click(within(field).getByRole('combobox'));
  });
};

const getMultipleListsToggle = () =>
  screen
    .getByText('blocks.mailchimpForm.multipleLists')
    .parentElement!.querySelector('input')!;

describe('MailchimpFormBlock', () => {
  it('should default to a single list', () => {
    expect(defaultValue).toMatchObject({
      multipleLists: false,
      listsLayout: MailchimpFormListsLayout.List,
      lists: [],
    });
  });

  it('should not show the lists panel if multiple lists is disabled', () => {
    renderBlock();

    expect(screen.queryByText('blocks.mailchimpForm.lists')).toBeNull();
    expect(screen.queryByText('blocks.mailchimpForm.addList')).toBeNull();
    expect(
      screen.queryByText('blocks.mailchimpForm.listReferenceHelp')
    ).toBeNull();
  });

  it('should show the lists panel after enabling multiple lists', () => {
    const latest = renderBlock();

    fireEvent.click(getMultipleListsToggle());

    expect(latest.value.multipleLists).toBe(true);
    expect(screen.getByText('blocks.mailchimpForm.lists')).toBeTruthy();
    expect(screen.getByText('blocks.mailchimpForm.addList')).toBeTruthy();
    expect(
      screen.getByText('blocks.mailchimpForm.listReferenceHelp')
    ).toBeTruthy();
  });

  it('should switch the layout between list and grid', () => {
    const latest = renderBlock({ multipleLists: true });

    fireEvent.click(
      screen.getByLabelText('blocks.mailchimpForm.listsLayoutGrid')
    );
    expect(latest.value.listsLayout).toBe(MailchimpFormListsLayout.Grid);

    fireEvent.click(
      screen.getByLabelText('blocks.mailchimpForm.listsLayoutList')
    );
    expect(latest.value.listsLayout).toBe(MailchimpFormListsLayout.List);
  });

  it('should add, edit and remove lists', () => {
    const latest = renderBlock({ multipleLists: true });

    fireEvent.click(screen.getByText('blocks.mailchimpForm.addList'));
    fireEvent.click(screen.getByText('blocks.mailchimpForm.addList'));

    expect(latest.value.lists).toEqual([
      { listId: '', name: '', description: null, image: null },
      { listId: '', name: '', description: null, image: null },
    ]);

    const [firstName, secondName] = screen.getAllByText(
      'blocks.mailchimpForm.listName'
    );
    fireEvent.change(firstName.parentElement!.querySelector('input')!, {
      target: { value: 'Daily Briefing' },
    });
    fireEvent.change(secondName.parentElement!.querySelector('input')!, {
      target: { value: 'Weekly Culture' },
    });

    const [firstDescription] = screen.getAllByText(
      'blocks.mailchimpForm.listDescription'
    );
    fireEvent.change(
      firstDescription.parentElement!.querySelector('textarea')!,
      {
        target: { value: 'Every morning' },
      }
    );

    expect(latest.value.lists).toMatchObject([
      { name: 'Daily Briefing', description: 'Every morning' },
      { name: 'Weekly Culture', description: null },
    ]);

    const firstItem = screen.getByText('Daily Briefing').closest('.rs-panel')!;
    fireEvent.click(within(firstItem as HTMLElement).getAllByRole('button')[0]);

    expect(latest.value.lists).toMatchObject([{ name: 'Weekly Culture' }]);
  });

  it('should prefill the name with the name of the picked Mailchimp list', async () => {
    const latest = renderBlock({
      multipleLists: true,
      lists: [{ listId: '', name: '', description: null, image: null }],
    });

    const listLabels = screen.getAllByText('blocks.mailchimpForm.list');
    const itemPicker = listLabels[listLabels.length - 1].parentElement!;

    await openListPicker(itemPicker);

    fireEvent.click(
      await screen.findByRole('option', { name: 'Weekly Culture' })
    );

    await waitFor(() =>
      expect(latest.value.lists).toMatchObject([
        { listId: 'list-weekly', name: 'Weekly Culture' },
      ])
    );
  });

  it('should not overwrite a custom name when picking a Mailchimp list', async () => {
    const latest = renderBlock({
      multipleLists: true,
      lists: [
        { listId: '', name: 'My newsletter', description: null, image: null },
      ],
    });

    const listLabels = screen.getAllByText('blocks.mailchimpForm.list');
    const itemPicker = listLabels[listLabels.length - 1].parentElement!;

    await openListPicker(itemPicker);

    fireEvent.click(
      await screen.findByRole('option', { name: 'Daily Briefing' })
    );

    await waitFor(() =>
      expect(latest.value.lists).toMatchObject([
        { listId: 'list-daily', name: 'My newsletter' },
      ])
    );
  });

  it('should not allow adding lists without a Mailchimp account', () => {
    const latest = renderBlock({ multipleLists: true, syncProviderId: null });

    const addButton = screen
      .getByText('blocks.mailchimpForm.addList')
      .closest('button')!;
    fireEvent.click(addButton);

    expect(addButton.disabled).toBe(true);
    expect(latest.value.lists).toEqual([]);
  });
});
