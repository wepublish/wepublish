import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockInterestsMailchimpFormBlock,
  mockMailchimpFormBlock,
  mockMailchimpFormFieldConfig,
  mockMailchimpFormInterestsInput,
  mockMailchimpFormStep,
  mockMailchimpFormSuccessOption,
  mockMailchimpFormSuccessPage,
  mockMailchimpSubscribeResult,
  mockOperation,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  AddMailchimpContactDocument,
  AddMailchimpContactMutationVariables,
  FullMailchimpFormBlockFragment,
  MailchimpContactStatus,
  MailchimpFormOptionsLayout,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { MailchimpFormBlock } from './mailchimp-form-block';

const EMAIL = 'reader@example.com';
const emailField = mockMailchimpFormFieldConfig();
const interestsField = mockMailchimpFormInterestsInput();
const [dailyInterest, weeklyInterest, localInterest] = interestsField.options;
const nameField = mockMailchimpFormFieldConfig({
  inputType: 'text',
  name: 'FNAME',
  label: 'First name',
  required: false,
});
const successPage = mockMailchimpFormSuccessPage();

const subscribe = (
  input: Partial<AddMailchimpContactMutationVariables['input']> = {},
  result = mockMailchimpSubscribeResult()
) =>
  mockOperation(AddMailchimpContactDocument, {
    variables: {
      input: {
        syncProviderId: 'sync-provider',
        listId: 'list-daily',
        email: EMAIL,
        status: MailchimpContactStatus.Pending,
        mergeFields: {},
        interests: {},
        ...input,
      },
    },
    data: { __typename: 'Mutation', addMailchimpContact: result },
  });

const renderForm = (
  block: FullMailchimpFormBlockFragment,
  mocks: ReturnType<typeof subscribe>[] = []
) => {
  const user = userEvent.setup();

  return {
    user,
    ...renderWithProviders(<MailchimpFormBlock {...block} />, { mocks }),
  };
};

const emailInput = () =>
  screen.getByRole('textbox', { name: emailField.label ?? '' });

const submitButton = () =>
  screen.getByRole('button', { name: t('newsletter.submit') });

const interestCheckbox = (name: string) =>
  screen.getByRole('checkbox', { name: new RegExp(name) });

describe('MailchimpFormBlock', () => {
  it('asks for the email address without offering interests', () => {
    renderForm(mockMailchimpFormBlock());

    expect(emailInput()).toBeRequired();
    expect(emailInput()).toHaveAttribute('type', 'email');
    expect(submitButton()).toBeEnabled();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('labels the submit button with the configured label', () => {
    renderForm(mockMailchimpFormBlock({ submitButtonLabel: 'Jetzt anmelden' }));

    expect(
      screen.getByRole('button', { name: 'Jetzt anmelden' })
    ).toHaveAttribute('type', 'submit');
  });

  it('subscribes with double opt-in and the preset interests, then shows the success page', async () => {
    const { user } = renderForm(
      mockMailchimpFormBlock({ interests: ['interest-preset'], successPage }),
      [subscribe({ interests: { 'interest-preset': true } })]
    );

    await user.type(emailInput(), EMAIL);
    await user.click(submitButton());

    expect(
      await screen.findByText(successPage.description ?? '')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: successPage.options[0].label })
    ).toHaveAttribute('href', successPage.options[0].url);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('fills the merge fields of the success links with the form data', async () => {
    const { user } = renderForm(
      mockMailchimpFormBlock({
        successPage: mockMailchimpFormSuccessPage({
          options: [
            mockMailchimpFormSuccessOption({
              label: 'Profil vervollständigen',
              url: 'https://example.com/profile?email=|*EMAIL*|&name=|*FNAME*|',
            }),
          ],
        }),
      }),
      [subscribe()]
    );

    await user.type(emailInput(), EMAIL);
    await user.click(submitButton());

    expect(
      await screen.findByRole('link', { name: 'Profil vervollständigen' })
    ).toHaveAttribute(
      'href',
      `https://example.com/profile?email=${encodeURIComponent(EMAIL)}&name=`
    );
  });

  it('disables the submit button while subscribing', async () => {
    const { user } = renderForm(mockMailchimpFormBlock({ successPage }), [
      { ...subscribe(), delay: Infinity },
    ]);

    await user.type(emailInput(), EMAIL);
    await user.click(submitButton());

    expect(submitButton()).toBeDisabled();
  });

  it('shows the error Mailchimp answers with and keeps the form', async () => {
    const { user } = renderForm(mockMailchimpFormBlock({ successPage }), [
      subscribe(
        {},
        mockMailchimpSubscribeResult({ success: false, error: 'Member exists' })
      ),
    ]);

    await user.type(emailInput(), EMAIL);
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Member exists');
    expect(emailInput()).toHaveValue(EMAIL);
    expect(submitButton()).toBeEnabled();
  });

  it('shows an error when the request fails', async () => {
    const { user } = renderForm(mockMailchimpFormBlock({ successPage }), [
      mockOperation(AddMailchimpContactDocument, {
        variables: subscribe().request.variables,
        errors: [{ message: 'Sync provider unreachable' }],
      }),
    ]);

    await user.type(emailInput(), EMAIL);
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown error');
    expect(submitButton()).toBeEnabled();
  });

  it('refuses to subscribe when no list is configured', async () => {
    const { user } = renderForm(mockMailchimpFormBlock({ listId: null }));

    await user.type(emailInput(), EMAIL);
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Form is not configured.'
    );
  });

  it('prefills a field from its url parameter', () => {
    const previousUrl = window.location.href;
    window.history.replaceState(null, '', '/?mail=prefilled%40example.com');
    onTestFinished(() => window.history.replaceState(null, '', previousUrl));

    renderForm(
      mockMailchimpFormBlock({
        steps: [
          mockMailchimpFormStep({
            inputs: [mockMailchimpFormFieldConfig({ urlParam: 'mail' })],
          }),
        ],
      })
    );

    expect(emailInput()).toHaveValue('prefilled@example.com');
  });

  it('submits the default value of an empty merge field', async () => {
    const { user } = renderForm(
      mockMailchimpFormBlock({
        successPage,
        steps: [
          mockMailchimpFormStep({
            inputs: [
              emailField,
              mockMailchimpFormFieldConfig({
                inputType: 'hidden',
                name: 'SOURCE',
                label: null,
                required: false,
                defaultValue: 'website',
              }),
            ],
          }),
        ],
      }),
      [subscribe({ mergeFields: { SOURCE: 'website' } })]
    );

    await user.type(emailInput(), EMAIL);
    await user.click(submitButton());

    expect(
      await screen.findByText(successPage.description ?? '')
    ).toBeInTheDocument();
  });

  describe.each([
    MailchimpFormOptionsLayout.List,
    MailchimpFormOptionsLayout.Grid,
  ])('with interests as %s', optionsLayout => {
    const block = mockInterestsMailchimpFormBlock(
      { successPage },
      { optionsLayout }
    );

    it('shows every interest with its description and image', () => {
      const { container } = renderForm(block);

      expect(screen.getByText(interestsField.label ?? '')).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);

      for (const option of interestsField.options) {
        expect(interestCheckbox(option.name)).not.toBeChecked();
      }

      expect(
        screen.getByText(dailyInterest.description ?? '')
      ).toBeInTheDocument();
      expect(
        screen.getByText(weeklyInterest.description ?? '')
      ).toBeInTheDocument();
      expect(container.querySelectorAll('img')).toHaveLength(2);
    });

    it('toggles an interest by clicking its name', async () => {
      const { user } = renderForm(block);

      await user.click(screen.getByText(weeklyInterest.name));
      expect(interestCheckbox(weeklyInterest.name)).toBeChecked();

      await user.click(screen.getByText(weeklyInterest.name));
      expect(interestCheckbox(weeklyInterest.name)).not.toBeChecked();
    });

    it('subscribes directly with the selected and the preset interests', async () => {
      const { user } = renderForm(
        { ...block, interests: ['interest-preset'], doubleOptIn: false },
        [
          subscribe({
            status: MailchimpContactStatus.Subscribed,
            interests: {
              'interest-preset': true,
              [weeklyInterest.id]: true,
              [dailyInterest.id]: true,
            },
          }),
        ]
      );

      await user.type(emailInput(), EMAIL);
      await user.click(interestCheckbox(weeklyInterest.name));
      await user.click(interestCheckbox(dailyInterest.name));
      await user.click(submitButton());

      expect(
        await screen.findByText(successPage.description ?? '')
      ).toBeInTheDocument();
    });
  });

  it('does not submit an interest that was deselected again', async () => {
    const { user } = renderForm(
      mockInterestsMailchimpFormBlock({ successPage }),
      [subscribe({ interests: {} })]
    );

    await user.type(emailInput(), EMAIL);
    await user.click(interestCheckbox(dailyInterest.name));
    await user.click(interestCheckbox(dailyInterest.name));
    await user.click(submitButton());

    expect(
      await screen.findByText(successPage.description ?? '')
    ).toBeInTheDocument();
  });

  it('asks for an interest when one is required and subscribes once one is selected', async () => {
    const { user } = renderForm(
      mockInterestsMailchimpFormBlock({ successPage }, { required: true }),
      [subscribe({ interests: { [localInterest.id]: true } })]
    );

    await user.type(emailInput(), EMAIL);
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      t('newsletter.noInterestSelected')
    );

    await user.click(interestCheckbox(localInterest.name));
    await user.click(submitButton());

    expect(
      await screen.findByText(successPage.description ?? '')
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('with a step shown only for the weekly newsletter', () => {
    const block = mockMailchimpFormBlock({
      successPage,
      steps: [
        mockMailchimpFormStep({ inputs: [emailField, interestsField] }),
        mockMailchimpFormStep({
          showIfInterestsFilled: [weeklyInterest.id],
          inputs: [nameField],
        }),
      ],
    });

    it('asks for the name after the weekly newsletter was selected and subscribes again with it', async () => {
      const { user } = renderForm(block, [
        subscribe({
          mergeFields: { FNAME: '' },
          interests: { [weeklyInterest.id]: true },
        }),
        subscribe({
          mergeFields: { FNAME: 'Jane' },
          interests: { [weeklyInterest.id]: true },
        }),
      ]);

      await user.type(emailInput(), EMAIL);
      await user.click(interestCheckbox(weeklyInterest.name));
      await user.click(
        screen.getByRole('button', { name: t('newsletter.next') })
      );

      const firstName = await screen.findByRole('textbox', {
        name: nameField.label ?? '',
      });
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

      await user.type(firstName, 'Jane');
      await user.click(submitButton());

      expect(
        await screen.findByText(successPage.description ?? '')
      ).toBeInTheDocument();
    });

    it('skips the name step without the weekly newsletter', async () => {
      const { user } = renderForm(block, [
        subscribe({
          mergeFields: { FNAME: '' },
          interests: { [dailyInterest.id]: true },
        }),
      ]);

      await user.type(emailInput(), EMAIL);
      await user.click(interestCheckbox(dailyInterest.name));
      await user.click(
        screen.getByRole('button', { name: t('newsletter.next') })
      );

      expect(
        await screen.findByText(successPage.description ?? '')
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('textbox', { name: nameField.label ?? '' })
      ).not.toBeInTheDocument();
    });

    it('goes back to the first step with the entered data', async () => {
      const { user } = renderForm(block, [
        subscribe({
          mergeFields: { FNAME: '' },
          interests: { [weeklyInterest.id]: true },
        }),
      ]);

      await user.type(emailInput(), EMAIL);
      await user.click(interestCheckbox(weeklyInterest.name));
      await user.click(
        screen.getByRole('button', { name: t('newsletter.next') })
      );
      await user.click(
        await screen.findByRole('button', { name: t('newsletter.back') })
      );

      await waitFor(() => expect(emailInput()).toHaveValue(EMAIL));
      expect(interestCheckbox(weeklyInterest.name)).toBeChecked();
      expect(
        screen.queryByRole('button', { name: t('newsletter.back') })
      ).not.toBeInTheDocument();
    });
  });
});
