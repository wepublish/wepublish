import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  CreateCrowdfundingDocument,
  type CreateCrowdfundingMutationVariables,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';

import {
  createCrowdfundingMock,
  failingMutationMock,
  pickerMocks,
  wireFormat,
} from '../testing/crowdfunding-mocks';
import {
  additionalRevenue,
  additionalSubscriptions,
  addGoal,
  chooseGoalType,
  controlOf,
  goalAmounts,
  goalDescriptions,
  goalRevenues,
  goalTitles,
  goalType,
  name,
  pickMemberPlan,
  saveAndCloseButton,
  saveButton,
  settled,
  trackUnhandledRejections,
  typeDate,
} from '../testing/crowdfunding-queries';
import { CreateCrowdfundingForm } from './create-crowdfunding-form';

const requiredError = 'form.errors.required';

const sent = vi.fn<(variables: CreateCrowdfundingMutationVariables) => void>();

const unhandled = trackUnhandledRejections();

const renderCreate = (
  mocks = [...pickerMocks(), createCrowdfundingMock(sent)]
) =>
  renderFormRoutes(
    { '/crowdfundings/create': <CreateCrowdfundingForm /> },
    { route: '/crowdfundings/create', mocks }
  );

beforeEach(() => {
  sent.mockClear();
});

describe('CreateCrowdfundingForm', () => {
  it('is memoised by the React Compiler', () => {
    expect(CreateCrowdfundingForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('renders the header, its sections and the empty fields of a subscription crowdfunding', () => {
    renderCreate();

    expect(screen.getByText('crowdfunding.create.title')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/crowdfundings'
    );
    expect(saveButton()).toHaveAttribute('type', 'submit');
    expect(saveAndCloseButton()).toHaveAttribute('type', 'submit');

    expect(screen.getAllByRole('region')).toEqual(
      [
        'crowdfunding.form.crowdfunding',
        'crowdfunding.form.filter',
        'crowdfunding.form.goals',
      ].map(title => screen.getByRole('region', { name: title }))
    );

    expect(name()).toHaveValue('');
    expect(goalType()).toHaveTextContent(
      'crowdfunding.form.goalTypes.Subscription'
    );
    expect(additionalSubscriptions()).toHaveValue(null);
    expect(screen.queryByText('CHF')).not.toBeInTheDocument();
    expect(goalTitles()).toHaveLength(0);
    expect(
      screen.getByPlaceholderText('crowdfunding.form.selectMemberPlans')
    ).toBeInTheDocument();
  });

  it('places every field in its section', () => {
    renderCreate();

    const crowdfunding = formSectionOf('crowdfunding.form.crowdfunding');

    expect(
      crowdfunding.getByRole('textbox', { name: /^crowdfunding\.form\.name/ })
    ).toBe(name());
    expect(
      crowdfunding.getByRole('combobox', {
        name: /^crowdfunding\.form\.goalType/,
      })
    ).toBe(goalType());
    expect(
      crowdfunding.getByRole('spinbutton', {
        name: /^crowdfunding\.form\.additionalSubscriptions/,
      })
    ).toBe(additionalSubscriptions());

    const filter = formSectionOf('crowdfunding.form.filter');

    expect(
      filter.getByPlaceholderText('crowdfunding.form.selectMemberPlans')
    ).toBeInTheDocument();
    expect(
      filter.getByText(/^crowdfunding\.form\.countSubscriptionsFrom/, {
        selector: 'label',
      })
    ).toBeInTheDocument();
    expect(
      filter.getByText(/^crowdfunding\.form\.countSubscriptionsUntil/, {
        selector: 'label',
      })
    ).toBeInTheDocument();

    const goals = formSectionOf('crowdfunding.form.goals');

    expect(goals.getByText('crowdfunding.form.goalsInfo')).toBeVisible();
    expect(
      goals.getByRole('group', { name: 'crowdfunding.form.goals' })
    ).toBeInTheDocument();
    expect(goals.getAllByText('crowdfunding.form.goals')).toHaveLength(1);
    expect(
      goals.getByRole('button', { name: 'crowdfunding.goalsForm.add' })
    ).toBeInTheDocument();
  });

  it('explains the fields that carry an info tooltip', () => {
    renderCreate();

    for (const info of [
      'crowdfunding.form.goalTypeInfo',
      'crowdfunding.form.additionalSubscriptionsInfo',
      'crowdfunding.form.memberPlansInfo',
    ]) {
      expect(screen.getByRole('button', { name: info })).toBeInTheDocument();
    }
  });

  it('offers both goal types and starts with subscriptions', async () => {
    const { user } = renderCreate();

    await user.click(goalType());

    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual([
      'crowdfunding.form.goalTypes.Revenue',
      'crowdfunding.form.goalTypes.Subscription',
    ]);
  });

  it('requires a name and does not create the crowdfunding without it', async () => {
    const { user, currentPath } = renderCreate();

    await user.click(saveButton());

    await waitFor(() =>
      expect(controlOf(name())).toHaveTextContent(requiredError)
    );
    expect(sent).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/crowdfundings/create');
  });

  it('shows the error of the name as soon as it is left empty', async () => {
    const { user } = renderCreate();

    await user.click(name());
    await user.tab();

    await waitFor(() =>
      expect(controlOf(name())).toHaveTextContent(requiredError)
    );
  });

  it('creates a crowdfunding with its goals and opens it for editing', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), 'Rettet die Zeitung');
    await user.click(addGoal());

    expect(goalAmounts()[0]).toHaveValue(0);

    await user.type(goalTitles()[0], 'Basis');
    await user.type(goalDescriptions()[0], 'Die Grundfinanzierung');
    await user.clear(goalAmounts()[0]);
    await user.type(goalAmounts()[0], '300');
    await user.click(saveButton());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(wireFormat(sent.mock.calls[0][0])).toStrictEqual({
      input: {
        name: 'Rettet die Zeitung',
        goalType: 'Subscription',
        additionalRevenue: null,
        memberPlans: [],
        countSubscriptionsFrom: null,
        countSubscriptionsUntil: null,
        goals: [
          { title: 'Basis', description: 'Die Grundfinanzierung', amount: 300 },
        ],
      },
    });
    await waitFor(() =>
      expect(currentPath()).toBe('/crowdfundings/edit/crowdfunding-new')
    );
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('creates a crowdfunding with every field filled and returns to the list on save and close', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), 'Rettet die Zeitung');
    await user.type(additionalSubscriptions(), '25');
    await pickMemberPlan(user, 'Monatsabo');
    await pickMemberPlan(user, 'Jahresabo');
    await user.keyboard('{Escape}');
    await typeDate(
      user,
      /^crowdfunding\.form\.countSubscriptionsFrom/,
      '01.01.2026 08:00'
    );
    await typeDate(
      user,
      /^crowdfunding\.form\.countSubscriptionsUntil/,
      '31.03.2026 18:30'
    );
    await user.click(addGoal());
    await user.click(addGoal());
    await user.type(goalTitles()[0], 'Basis');
    await user.clear(goalAmounts()[0]);
    await user.type(goalAmounts()[0], '300');
    await user.type(goalTitles()[1], 'Ausbau');
    await user.type(goalDescriptions()[1], 'Eine zweite Stelle');
    await user.clear(goalAmounts()[1]);
    await user.type(goalAmounts()[1], '500');
    await user.click(saveAndCloseButton());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(wireFormat(sent.mock.calls[0][0])).toStrictEqual({
      input: {
        name: 'Rettet die Zeitung',
        goalType: 'Subscription',
        additionalRevenue: 25,
        memberPlans: [{ id: 'plan-monthly' }, { id: 'plan-yearly' }],
        countSubscriptionsFrom: '2026-01-01T08:00:00.000Z',
        countSubscriptionsUntil: '2026-03-31T18:30:00.000Z',
        goals: [
          { title: 'Basis', description: '', amount: 300 },
          { title: 'Ausbau', description: 'Eine zweite Stelle', amount: 500 },
        ],
      },
    });
    await waitFor(() => expect(currentPath()).toBe('/crowdfundings'));
  });

  it('asks for every amount in CHF once the goals are measured in revenue', async () => {
    const { user } = renderCreate();

    await chooseGoalType(user, 'Revenue');
    await user.click(addGoal());

    expect(additionalRevenue()).toHaveAccessibleDescription(
      expect.stringContaining('CHF')
    );
    expect(
      screen.getByRole('button', {
        name: 'crowdfunding.form.additionalRevenueInfo',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('spinbutton', {
        name: /^crowdfunding\.form\.additionalSubscriptions/,
      })
    ).not.toBeInTheDocument();
    expect(goalRevenues()).toHaveLength(1);
    expect(goalRevenues()[0]).toHaveAccessibleDescription(
      expect.stringContaining('CHF')
    );
    expect(goalAmounts()).toHaveLength(0);
  });

  it('sends the amounts of a revenue crowdfunding in whole cents', async () => {
    const { user } = renderCreate();

    await chooseGoalType(user, 'Revenue');
    await user.type(name(), 'Rettet die Zeitung');
    await user.type(additionalRevenue(), '4.35');
    await user.click(addGoal());
    await user.type(goalTitles()[0], 'Basis');
    await user.clear(goalRevenues()[0]);
    await user.type(goalRevenues()[0], '1500.10');
    await user.click(saveButton());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(wireFormat(sent.mock.calls[0][0]).input).toMatchObject({
      goalType: 'Revenue',
      additionalRevenue: 435,
      goals: [{ title: 'Basis', description: '', amount: 150010 }],
    });
  });

  it('requires a title and an amount for every goal', async () => {
    const { user } = renderCreate();

    await user.type(name(), 'Rettet die Zeitung');
    await user.click(addGoal());
    await user.clear(goalAmounts()[0]);
    await user.click(saveButton());

    await waitFor(() =>
      expect(controlOf(goalTitles()[0])).toHaveTextContent(requiredError)
    );
    expect(controlOf(goalAmounts()[0])).toHaveTextContent(requiredError);
    expect(sent).not.toHaveBeenCalled();
  });

  it.each([
    { value: '-3', error: 'form.errors.too_small.number.inclusive' },
    { value: '1.5', error: 'form.errors.invalid_type.int' },
  ])('rejects $value as a subscription count', async ({ value, error }) => {
    const { user } = renderCreate();

    await user.type(name(), 'Rettet die Zeitung');
    fireEvent.change(additionalSubscriptions(), { target: { value } });
    await user.click(addGoal());
    await user.type(goalTitles()[0], 'Basis');
    fireEvent.change(goalAmounts()[0], { target: { value } });
    await user.click(saveButton());

    await waitFor(() =>
      expect(controlOf(additionalSubscriptions())).toHaveTextContent(error)
    );
    expect(controlOf(goalAmounts()[0])).toHaveTextContent(error);
    expect(sent).not.toHaveBeenCalled();
  });

  it('removes a goal again', async () => {
    const { user } = renderCreate();

    await user.click(addGoal());
    await user.click(addGoal());
    await user.type(goalTitles()[1], 'Ausbau');
    await user.click(
      screen.getAllByRole('button', { name: 'form.array.remove' })[0]
    );

    expect(goalTitles().map(input => input.value)).toEqual(['Ausbau']);
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), 'Rettet die Zeitung');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await waitFor(() => expect(currentPath()).toBe('/crowdfundings'));
  });

  it('shows a toast and an inline alert and stays on the page when creating fails', async () => {
    const { user, currentPath } = renderCreate([
      ...pickerMocks(),
      failingMutationMock(CreateCrowdfundingDocument, 'Server down'),
    ]);

    await user.type(name(), 'Rettet die Zeitung');
    await user.click(saveButton());

    expect(await screen.findByText('Server down')).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(currentPath()).toBe('/crowdfundings/create');
    expect(name()).toHaveValue('Rettet die Zeitung');
    await settled();
    expect(unhandled).toEqual([]);
  });
});
