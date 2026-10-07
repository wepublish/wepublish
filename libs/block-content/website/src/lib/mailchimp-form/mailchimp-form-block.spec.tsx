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
  MailchimpFormOptionsLayout,
} from '@wepublish/website/api';
import {
  mockInterestsMailchimpFormBlock,
  mockMailchimpFormBlock,
  mockMailchimpFormFieldConfig,
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
              // Apollo Client 4 matches variables through `request.variables`,
              // which accepts a predicate; `variableMatcher` is gone.
              request: {
                query: AddMailchimpContactDocument,
                variables: () => true,
              },
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

const getInterestCheckbox = (name: string) =>
  screen.getByRole('checkbox', { name: new RegExp(name) });

describe('Mailchimp Form Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  describe('without interests', () => {
    it('should not render any interest selection', () => {
      renderBlock(mockMailchimpFormBlock());

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });

    it('should subscribe to the configured list with the preset interests', async () => {
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
          listId: 'list-daily',
          mergeFields: {},
          interests: { 'interest-1': true },
        },
      });
    });

    it('should show a configuration error if no list is configured', async () => {
      const { result } = renderBlock(mockMailchimpFormBlock({ listId: null }));

      fillEmail();
      await submit();

      expect(screen.getByRole('alert').textContent).toContain(
        'Form is not configured.'
      );
      expect(result).not.toHaveBeenCalled();
    });
  });

  describe('interests', () => {
    it.each([MailchimpFormOptionsLayout.List, MailchimpFormOptionsLayout.Grid])(
      'should render every interest with name, description and image as %s',
      optionsLayout => {
        const { container } = renderBlock(
          mockInterestsMailchimpFormBlock({}, { optionsLayout })
        );

        expect(screen.getByText('Newsletters')).toBeTruthy();
        expect(screen.getAllByRole('checkbox')).toHaveLength(3);
        expect(getInterestCheckbox('Daily Briefing')).toBeTruthy();
        expect(getInterestCheckbox('Weekly Culture')).toBeTruthy();
        expect(getInterestCheckbox('Local News')).toBeTruthy();
        expect(
          screen.getByText('The most important news every morning.')
        ).toBeTruthy();
        expect(
          screen.getByText('Exhibitions, concerts and books of the week.')
        ).toBeTruthy();
        expect(container.querySelectorAll('img')).toHaveLength(2);
      }
    );

    it.each([MailchimpFormOptionsLayout.List, MailchimpFormOptionsLayout.Grid])(
      'should toggle an interest by clicking on it as %s',
      optionsLayout => {
        renderBlock(mockInterestsMailchimpFormBlock({}, { optionsLayout }));

        const checkbox = getInterestCheckbox(
          'Weekly Culture'
        ) as HTMLInputElement;
        expect(checkbox.checked).toBe(false);

        fireEvent.click(screen.getByText('Weekly Culture'));
        expect(checkbox.checked).toBe(true);

        fireEvent.click(screen.getByText('Weekly Culture'));
        expect(checkbox.checked).toBe(false);
      }
    );

    it('should subscribe to the configured list with the selected and preset interests', async () => {
      const { result } = renderBlock(
        mockInterestsMailchimpFormBlock({
          interests: ['interest-preset'],
          doubleOptIn: false,
        })
      );

      fillEmail();
      fireEvent.click(getInterestCheckbox('Weekly Culture'));
      fireEvent.click(getInterestCheckbox('Daily Briefing'));
      await submit();

      await waitFor(() => expect(result).toHaveBeenCalledTimes(1));
      expect(result).toHaveBeenCalledWith({
        input: {
          syncProviderId: 'sync-provider',
          email: 'reader@example.com',
          status: MailchimpContactStatus.Subscribed,
          listId: 'list-daily',
          mergeFields: {},
          interests: {
            'interest-preset': true,
            'interest-weekly': true,
            'interest-daily': true,
          },
        },
      });
    });

    it('should not submit an interest that was deselected again', async () => {
      const { result } = renderBlock(mockInterestsMailchimpFormBlock());

      fillEmail();
      fireEvent.click(getInterestCheckbox('Daily Briefing'));
      fireEvent.click(getInterestCheckbox('Daily Briefing'));
      await submit();

      await waitFor(() => expect(result).toHaveBeenCalledTimes(1));
      expect(result).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ interests: {} }),
        })
      );
    });

    it('should allow submitting without interests if not required', async () => {
      const { result } = renderBlock(mockInterestsMailchimpFormBlock());

      fillEmail();
      await submit();

      await waitFor(() => expect(result).toHaveBeenCalledTimes(1));
    });

    it('should require at least one interest if required', async () => {
      const { result } = renderBlock(
        mockInterestsMailchimpFormBlock({}, { required: true })
      );

      fillEmail();
      await submit();

      expect(screen.getByRole('alert').textContent).toContain(
        i18next.t('newsletter.noInterestSelected')
      );
      expect(result).not.toHaveBeenCalled();
    });

    it('should clear the error once an interest is selected and submitted', async () => {
      const { result } = renderBlock(
        mockInterestsMailchimpFormBlock({}, { required: true })
      );

      fillEmail();
      await submit();
      expect(screen.queryByRole('alert')).toBeTruthy();

      fireEvent.click(getInterestCheckbox('Local News'));
      await submit();

      await waitFor(() => expect(result).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('should show steps depending on the selected interests', async () => {
      const block = mockInterestsMailchimpFormBlock();
      const { result } = renderBlock({
        ...block,
        steps: [
          ...block.steps,
          {
            __typename: 'MailchimpFormStep',
            skipIfFieldsFilled: [],
            skipIfInterestsFilled: [],
            showIfInterestsFilled: ['interest-weekly'],
            inputs: [
              mockMailchimpFormFieldConfig({
                inputType: 'text',
                name: 'FNAME',
                label: 'First name',
                required: false,
              }),
            ],
          },
        ],
      });

      fillEmail();
      fireEvent.click(getInterestCheckbox('Weekly Culture'));
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
            interests: { 'interest-weekly': true },
          }),
        })
      );
    });
  });
});
