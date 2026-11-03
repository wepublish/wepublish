import { screen, waitFor } from '@testing-library/react';
import {
  CrowdfundingGoalType,
  type UpdateCrowdfundingMutationVariables,
  UpdateCrowdfundingDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import {
  crowdfundingErrorMock,
  crowdfundingMock,
  failingMutationMock,
  pickerMocks,
  storedCrowdfunding,
  updateCrowdfundingMock,
  wireFormat,
} from '../testing/crowdfunding-mocks';
import {
  additionalRevenue,
  additionalSubscriptions,
  goalAmounts,
  goalDescriptions,
  goalRevenues,
  goalTitles,
  goalType,
  name,
  saveAndCloseButton,
  saveButton,
  settled,
  trackUnhandledRejections,
} from '../testing/crowdfunding-queries';
import {
  EditCrowdfundingForm,
  EditCrowdfundingView,
} from './edit-crowdfunding-form';

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        crowdfunding: {
          edit: { title: 'Edit {{crowdfundingName}}' },
          form: {
            subscriptions: 'Already {{subscriptions}} subscribed',
            revenue: 'Already CHF {{revenue}} financed',
          },
        },
      },
    },
  },
});

function Translated({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

const sent = vi.fn<(variables: UpdateCrowdfundingMutationVariables) => void>();

const unhandled = trackUnhandledRejections();

const editRoute = `/crowdfundings/edit/${storedCrowdfunding.id}`;

const renderEdit = (
  mocks = [
    crowdfundingMock(storedCrowdfunding),
    ...pickerMocks(),
    updateCrowdfundingMock(sent),
  ],
  wrapper?: (props: { children: ReactNode }) => ReactNode
) =>
  renderFormRoutes(
    { '/crowdfundings/edit/:id': <EditCrowdfundingForm /> },
    { route: editRoute, mocks, wrapper }
  );

const loaded = () =>
  waitFor(() => expect(name()).toHaveValue(storedCrowdfunding.name));

const expectedUpdate = {
  input: {
    id: 'crowdfunding-1',
    name: 'Rettet die Zeitung',
    additionalRevenue: 25,
    goalType: 'Subscription',
    memberPlans: [{ id: 'plan-monthly' }],
    countSubscriptionsFrom: '2026-01-01T08:00:00.000Z',
    countSubscriptionsUntil: '2026-03-31T18:30:00.000Z',
    goals: [
      { title: 'Basis', description: 'Die Grundfinanzierung', amount: 300 },
      { title: 'Ausbau', description: null, amount: 500 },
    ],
  },
};

beforeEach(() => {
  sent.mockClear();
});

describe('EditCrowdfundingForm', () => {
  it('is memoised by the React Compiler', () => {
    expect(EditCrowdfundingView.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the header and a progress indicator while the crowdfunding loads', async () => {
    renderEdit();

    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    await loaded();

    expect(saveButton()).toBeEnabled();
    expect(screen.getAllByRole('region')).toEqual(
      [
        'crowdfunding.form.crowdfunding',
        'crowdfunding.form.filter',
        'crowdfunding.form.goals',
        'crowdfunding.form.progress',
      ].map(title => screen.getByRole('region', { name: title }))
    );
  });

  it('loads the stored crowdfunding into the form', async () => {
    renderEdit(undefined, Translated);

    await loaded();

    expect(screen.getByText('Edit Rettet die Zeitung')).toBeInTheDocument();
    expect(goalType()).toHaveTextContent(
      'crowdfunding.form.goalTypes.Subscription'
    );
    expect(additionalSubscriptions()).toHaveValue(25);
    expect(
      getFieldByLabel(/^crowdfunding\.form\.countSubscriptionsFrom/)
    ).toHaveValue('01.01.2026 08:00');
    expect(
      getFieldByLabel(/^crowdfunding\.form\.countSubscriptionsUntil/)
    ).toHaveValue('31.03.2026 18:30');
    expect(goalTitles().map(input => input.value)).toEqual(['Basis', 'Ausbau']);
    expect(goalDescriptions().map(input => input.value)).toEqual([
      'Die Grundfinanzierung',
      '',
    ]);
    expect(goalAmounts().map(input => input.value)).toEqual(['300', '500']);
    expect(
      await screen.findByRole('button', { name: 'Monatsabo' })
    ).toBeInTheDocument();
  });

  it('shows the progress of the stored crowdfunding beside the form', async () => {
    renderEdit(undefined, Translated);

    await loaded();

    const progress = formSectionOf('crowdfunding.form.progress');

    expect(progress.getByText('Already 120 subscribed')).toBeInTheDocument();
    expect(progress.getByText('40%')).toBeInTheDocument();
  });

  it('updates the progress with the saved crowdfunding', async () => {
    const saved = {
      ...storedCrowdfunding,
      subscriptions: 150,
      activeGoal: storedCrowdfunding.activeGoal && {
        ...storedCrowdfunding.activeGoal,
        progress: 50,
      },
    };
    const { user } = renderEdit(
      [
        crowdfundingMock(storedCrowdfunding),
        ...pickerMocks(),
        updateCrowdfundingMock(sent, saved),
      ],
      Translated
    );

    await loaded();
    await user.click(saveButton());

    const progress = formSectionOf('crowdfunding.form.progress');

    expect(
      await progress.findByText('Already 150 subscribed')
    ).toBeInTheDocument();
    expect(progress.getByText('50%')).toBeInTheDocument();
  });

  it('saves the loaded crowdfunding unchanged and stays on the page', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(saveButton());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(wireFormat(sent.mock.calls[0][0])).toStrictEqual(expectedUpdate);
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe(editRoute);
  });

  it('removes a goal', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(
      screen.getAllByRole('button', { name: 'form.array.remove' })[0]
    );
    await user.click(saveButton());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(wireFormat(sent.mock.calls[0][0]).input.goals).toStrictEqual([
      expectedUpdate.input.goals[1],
    ]);
  });

  it('returns to the list on save and close', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(saveAndCloseButton());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(currentPath()).toBe('/crowdfundings'));
  });

  it('shows the amounts of a revenue crowdfunding in CHF', async () => {
    const revenue = {
      ...storedCrowdfunding,
      goalType: CrowdfundingGoalType.Revenue,
      additionalRevenue: 2500,
      goals: storedCrowdfunding.goals.map(goal => ({
        ...goal,
        amount: goal.amount * 100,
      })),
    };
    const { user } = renderEdit([
      crowdfundingMock(revenue),
      ...pickerMocks(),
      updateCrowdfundingMock(sent),
    ]);

    await loaded();

    expect(additionalRevenue()).toHaveValue('25.00');
    expect(goalRevenues().map(input => input.value)).toEqual([
      '300.00',
      '500.00',
    ]);

    await user.click(saveButton());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(wireFormat(sent.mock.calls[0][0]).input).toMatchObject({
      goalType: 'Revenue',
      additionalRevenue: 2500,
      goals: [
        { title: 'Basis', amount: 30000 },
        { title: 'Ausbau', amount: 50000 },
      ],
    });
  });

  it('reports a crowdfunding that cannot be loaded in place of the fields', async () => {
    renderEdit([
      crowdfundingErrorMock(storedCrowdfunding.id, 'Not found'),
      ...pickerMocks(),
    ]);

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(screen.getAllByText('Not found')).toHaveLength(2);
    expect(
      screen.queryByRole('textbox', { name: /^crowdfunding\.form\.name/ })
    ).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it('shows a toast and an inline alert and stays on the page when saving fails', async () => {
    const { user, currentPath } = renderEdit([
      crowdfundingMock(storedCrowdfunding),
      ...pickerMocks(),
      failingMutationMock(UpdateCrowdfundingDocument, 'Server down'),
    ]);

    await loaded();
    await user.click(saveAndCloseButton());

    expect(await screen.findByText('Server down')).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(currentPath()).toBe(editRoute);
    await settled();
    expect(unhandled).toEqual([]);
  });
});
