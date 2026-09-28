import { composeStories, composeStory } from '@storybook/react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  AddMailchimpContactDocument,
  MailchimpContactStatus,
  MailchimpFormBlock as MailchimpFormBlockType,
  MailchimpFormListsLayout,
} from '@wepublish/website/api';
import {
  mockMailchimpFormBlock,
  mockMultipleListsMailchimpFormBlock,
} from '@wepublish/storybook/mocks';
import i18next from 'i18next';
import * as stories from './mailchimp-form-block.stories';

const storiesCmp = composeStories(stories);

const renderBlock = (block: MailchimpFormBlockType) => {
  const result = vi.fn(() => ({
    data: {
      addMailchimpContact: {
        __typename: 'MailchimpSubscribeResult',
        success: true,
        error: null,
      },
    },
  }));

  const Story = composeStory(
    {
      args: block,
      parameters: {
        apolloClient: {
          mocks: [
            {
              request: { query: AddMailchimpContactDocument },
              variableMatcher: () => true,
              maxUsageCount: Number.POSITIVE_INFINITY,
              result,
            },
          ],
        },
      },
    },
    stories.default
  );

  const utils = render(<Story />);

  return { ...utils, result };
};

const fillEmail = (email = 'reader@example.com') => {
  fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
    target: { value: email },
  });
};

const submit = async () => {
  await act(async () => {
    fireEvent.submit(screen.getByRole('button').closest('form')!);
  });
};

const getListCheckbox = (name: string) =>
  screen.getByRole('checkbox', { name: new RegExp(name) });

describe('Mailchimp Form Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  describe('single list', () => {
    it('should not render any list selection', () => {
      renderBlock(mockMailchimpFormBlock());

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });

    it('should subscribe to the configured list', async () => {
      const { result } = renderBlock(
        mockMailchimpFormBlock({ interests: ['interest-1'] })
      );

      fillEmail();
      await submit();

      await waitFor(() => expect(result).toHaveBeenCalledTimes(1));
      expect(result).toHaveBeenCalledWith({
        input: {
          syncProviderId: 'sync-provider',
          email: 'reader@example.com',
          status: MailchimpContactStatus.Pending,
          mergeFields: {},
          listId: 'list-daily',
          interests: { 'interest-1': true },
        },
      });
    });

    it('should ignore configured lists if multiple lists is disabled', () => {
      renderBlock(
        mockMultipleListsMailchimpFormBlock({ multipleLists: false })
      );

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });
  });

  describe('multiple lists', () => {
    it.each([MailchimpFormListsLayout.List, MailchimpFormListsLayout.Grid])(
      'should render every list with name, description and image as %s',
      listsLayout => {
        const { container } = renderBlock(
          mockMultipleListsMailchimpFormBlock({ listsLayout })
        );

        expect(screen.getAllByRole('checkbox')).toHaveLength(3);
        expect(getListCheckbox('Daily Briefing')).toBeTruthy();
        expect(getListCheckbox('Weekly Culture')).toBeTruthy();
        expect(getListCheckbox('Local News')).toBeTruthy();
        expect(
          screen.getByText('The most important news every morning.')
        ).toBeTruthy();
        expect(
          screen.getByText('Exhibitions, concerts and books of the week.')
        ).toBeTruthy();
        expect(container.querySelectorAll('img')).toHaveLength(2);
      }
    );

    it.each([MailchimpFormListsLayout.List, MailchimpFormListsLayout.Grid])(
      'should toggle a list by clicking on it as %s',
      listsLayout => {
        renderBlock(mockMultipleListsMailchimpFormBlock({ listsLayout }));

        const checkbox = getListCheckbox('Weekly Culture') as HTMLInputElement;
        expect(checkbox.checked).toBe(false);

        fireEvent.click(screen.getByText('Weekly Culture'));
        expect(checkbox.checked).toBe(true);

        fireEvent.click(screen.getByText('Weekly Culture'));
        expect(checkbox.checked).toBe(false);
      }
    );

    it('should render the lists right before the submit button', () => {
      renderBlock(mockMultipleListsMailchimpFormBlock());

      const email = screen.getByRole('textbox', { name: /email/i });
      const checkboxes = screen.getAllByRole('checkbox');
      const button = screen.getByRole('button');

      for (const checkbox of checkboxes) {
        expect(
          email.compareDocumentPosition(checkbox) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(
          checkbox.compareDocumentPosition(button) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
      }
    });

    it('should require at least one list to be selected', async () => {
      const { result } = renderBlock(mockMultipleListsMailchimpFormBlock());

      fillEmail();
      await submit();

      expect(screen.getByRole('alert').textContent).toContain(
        i18next.t('newsletter.noListSelected')
      );
      expect(result).not.toHaveBeenCalled();
    });

    it('should clear the error once a list is selected and submitted', async () => {
      const { result } = renderBlock(mockMultipleListsMailchimpFormBlock());

      fillEmail();
      await submit();
      expect(screen.queryByRole('alert')).toBeTruthy();

      fireEvent.click(getListCheckbox('Local News'));
      await submit();

      await waitFor(() => expect(result).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('should not submit a list that was deselected again', async () => {
      const { result } = renderBlock(mockMultipleListsMailchimpFormBlock());

      fillEmail();
      fireEvent.click(getListCheckbox('Daily Briefing'));
      fireEvent.click(getListCheckbox('Daily Briefing'));
      await submit();

      expect(result).not.toHaveBeenCalled();
      expect(screen.queryByRole('alert')).toBeTruthy();
    });

    it('should subscribe to all selected lists and send interests only to the reference list', async () => {
      const { result } = renderBlock(
        mockMultipleListsMailchimpFormBlock({
          listId: 'list-daily',
          interests: ['interest-1'],
          doubleOptIn: false,
        })
      );

      fillEmail();
      fireEvent.click(getListCheckbox('Weekly Culture'));
      fireEvent.click(getListCheckbox('Daily Briefing'));
      await submit();

      await waitFor(() => expect(result).toHaveBeenCalledTimes(1));

      const [{ input }] = result.mock.calls[0] as unknown as [
        { input: Record<string, unknown> },
      ];

      expect(input).toEqual({
        syncProviderId: 'sync-provider',
        email: 'reader@example.com',
        status: MailchimpContactStatus.Subscribed,
        mergeFields: {},
        lists: [
          { listId: 'list-weekly', interests: undefined },
          { listId: 'list-daily', interests: { 'interest-1': true } },
        ],
      });
      expect(input).not.toHaveProperty('listId');
      expect(input).not.toHaveProperty('interests');
    });

    it('should not send interests if the reference list is not selected', async () => {
      const { result } = renderBlock(
        mockMultipleListsMailchimpFormBlock({
          listId: 'list-daily',
          interests: ['interest-1'],
        })
      );

      fillEmail();
      fireEvent.click(getListCheckbox('Local News'));
      await submit();

      await waitFor(() => expect(result).toHaveBeenCalledTimes(1));
      expect(result).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            lists: [{ listId: 'list-local', interests: undefined }],
          }),
        })
      );
    });

    it('should show a configuration error if no lists are configured', async () => {
      const { result } = renderBlock(
        mockMultipleListsMailchimpFormBlock({ lists: [] })
      );

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

      fillEmail();
      await submit();

      expect(screen.getByRole('alert').textContent).toContain(
        'Form is not configured.'
      );
      expect(result).not.toHaveBeenCalled();
    });

    it('should only show the lists on the first step', async () => {
      const block = mockMultipleListsMailchimpFormBlock();
      const { result } = renderBlock({
        ...block,
        steps: [
          ...block.steps,
          {
            __typename: 'MailchimpFormStep',
            skipIfFieldsFilled: [],
            skipIfInterestsFilled: [],
            showIfInterestsFilled: [],
            inputs: [
              {
                __typename: 'MailchimpFormFieldConfig',
                inputType: 'text',
                name: 'FNAME',
                label: 'First name',
                description: null,
                required: false,
                urlParam: null,
                defaultValue: null,
                value: null,
                options: [],
              },
            ],
          },
        ],
      });

      fillEmail();
      fireEvent.click(getListCheckbox('Weekly Culture'));
      await submit();

      await waitFor(() => expect(result).toHaveBeenCalledTimes(1));
      await screen.findByRole('textbox', { name: /first name/i });
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

      fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
        target: { value: 'Jane' },
      });
      await act(async () => {
        fireEvent.submit(
          screen.getByRole('textbox', { name: /first name/i }).closest('form')!
        );
      });

      await waitFor(() => expect(result).toHaveBeenCalledTimes(2));
      expect(result).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            mergeFields: { FNAME: 'Jane' },
            lists: [{ listId: 'list-weekly', interests: undefined }],
          }),
        })
      );
    });
  });
});
