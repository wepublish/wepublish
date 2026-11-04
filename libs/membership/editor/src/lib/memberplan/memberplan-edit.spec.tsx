import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import {
  CreateMemberPlanDocument,
  type CreateMemberPlanMutationVariables,
  type FullMemberPlanFragment,
  type UpdateMemberPlanMutationVariables,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';

import {
  createMemberPlanMock,
  memberPlanMock,
  pickerMocks,
  slugTakenMock,
  storedMemberPlan,
  updateMemberPlanMock,
  wireFormat,
} from '../../testing/memberplan-mocks';
import {
  MemberPlanCreateForm,
  MemberPlanCreateView,
} from './memberplan-create-view';
import { MemberPlanEditForm, MemberPlanEditView } from './memberplan-edit-view';

const created = vi.fn<(variables: CreateMemberPlanMutationVariables) => void>();
const updated = vi.fn<(variables: UpdateMemberPlanMutationVariables) => void>();

const name = () => getFieldByLabel(/^memberPlanEdit\.name/);
const slug = () => getFieldByLabel(/^memberPlanEdit\.slug/);
const extendable = () =>
  screen.getByRole('checkbox', { name: /^memberplanForm\.extendableToggle/ });
const forceAutoRenewal = () =>
  screen.getByRole('checkbox', { name: /^memberPlanEdit\.forceAutoRenewal/ });
const maxCount = () =>
  screen.getByRole('spinbutton', { name: /^memberplanForm\.maxCount/ });
const monthlyTarget = () =>
  screen.getByRole('textbox', {
    name: /^memberplanForm\.amountPerMonthTarget/,
  });

const renderMemberPlan = (
  route: string,
  {
    memberPlan = storedMemberPlan,
    mocks = [createMemberPlanMock(created), updateMemberPlanMock(updated)],
  }: {
    memberPlan?: FullMemberPlanFragment;
    mocks?: MockLink.MockedResponse[];
  } = {}
) =>
  renderFormRoutes(
    {
      '/memberplans/create': <MemberPlanCreateView />,
      '/memberplans/edit/:id': <MemberPlanEditView />,
    },
    {
      route,
      mocks: [
        ...pickerMocks(),
        memberPlanMock(memberPlan),
        ...mocks,
      ],
    }
  );

const loaded = async () =>
  waitFor(() => expect(name()).toHaveValue(storedMemberPlan.name));

const storedVariables = {
  name: 'Jahresabo',
  slug: 'jahresabo',
  tags: ['online'],
  imageID: null,
  description: null,
  shortDescription: null,
  active: true,
  availablePaymentMethods: [
    {
      paymentPeriodicities: ['monthly', 'yearly'],
      forceAutoRenewal: false,
      paymentMethodIDs: ['pm-invoice'],
    },
  ],
  currency: 'CHF',
  periodicityPricing: [
    {
      periodicity: 'monthly',
      label: null,
      amountMin: 1000,
      amountTarget: 1500,
      amountMax: null,
    },
    {
      periodicity: 'yearly',
      label: '2 Monate gratis',
      amountMin: 10000,
      amountTarget: null,
      amountMax: null,
    },
  ],
  defaultPaymentPeriodicity: 'yearly',
  extendable: true,
  externalReward: null,
  maxCount: null,
  productType: 'Subscription',
  migrateToTargetPaymentMethodID: null,
  successPageId: null,
  failPageId: null,
  confirmationPageId: null,
};

beforeEach(() => {
  created.mockClear();
  updated.mockClear();
});

describe('MemberPlanCreateView', () => {
  it('is memoised by the React Compiler', () => {
    expect(MemberPlanCreateForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('renders the header and its sections', async () => {
    renderMemberPlan('/memberplans/create');

    expect(
      screen.getByText('memberPlanEdit.createMemberPlanHeader')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/memberplans'
    );
    await waitFor(name);
    expect(screen.getAllByRole('region')).toEqual(
      [
        'memberplanForm.sections.general',
        'memberplanForm.sections.texts',
        'memberPlanEdit.paymentConfigs',
        'memberplanForm.periodicityPricing',
        'memberplanForm.trialSubscription',
        'memberplanForm.redirectionsTitle',
        'memberplanForm.sections.media',
      ].map(title => screen.getByRole('region', { name: title }))
    );
    expect(
      formSectionOf('memberplanForm.periodicityPricing').getByText(
        'memberplanForm.periodicityPricingNoPeriodicities'
      )
    ).toBeInTheDocument();
  });

  it('creates a plan with the slug derived from its name and opens it', async () => {
    const { user, currentPath } = renderMemberPlan('/memberplans/create');

    await user.type(await waitFor(name), 'Probeabo');

    expect(slug()).toHaveValue('probeabo');

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(wireFormat(created.mock.calls[0][0])).toStrictEqual({
      name: 'Probeabo',
      slug: 'probeabo',
      tags: [],
      imageID: null,
      description: null,
      shortDescription: null,
      active: true,
      availablePaymentMethods: [],
      currency: 'CHF',
      periodicityPricing: [
        {
          periodicity: 'monthly',
          label: null,
          amountMin: 0,
          amountTarget: null,
          amountMax: null,
        },
      ],
      defaultPaymentPeriodicity: null,
      extendable: true,
      externalReward: null,
      maxCount: null,
      productType: 'Subscription',
      migrateToTargetPaymentMethodID: null,
      successPageId: null,
      failPageId: null,
      confirmationPageId: null,
    });
    await waitFor(() =>
      expect(currentPath()).toBe('/memberplans/edit/plan-new')
    );
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('requires a name and does not create the plan without it', async () => {
    const { user, currentPath } = renderMemberPlan('/memberplans/create');

    await waitFor(name);
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(name()).toHaveAttribute('aria-invalid', 'true'));
    expect(name()).toHaveAccessibleDescription('form.errors.required');
    expect(created).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/memberplans/create');
  });

  it('shows a taken slug under the slug field', async () => {
    const { user, currentPath } = renderMemberPlan('/memberplans/create', {
      mocks: [slugTakenMock(CreateMemberPlanDocument)],
    });

    await user.type(await waitFor(name), 'Jahresabo');
    await user.click(screen.getByTestId('saveButton'));

    expect(
      await screen.findByText('memberPlanEdit.slugTaken')
    ).toBeInTheDocument();
    expect(slug()).toHaveAttribute('aria-invalid', 'true');
    expect(currentPath()).toBe('/memberplans/create');
  });

  it('names the limit after the product type', async () => {
    const { user } = renderMemberPlan('/memberplans/create');

    await user.click(
      await screen.findByRole('combobox', {
        name: /^memberplanForm\.productType/,
      })
    );
    await user.click(
      await screen.findByRole('option', {
        name: 'memberplanForm.productTypeDonation',
      })
    );

    expect(
      screen.getByRole('spinbutton', {
        name: /^memberplanForm\.maxCountDonation/,
      })
    ).toBeInTheDocument();
  });

  it('configures a trial plan in one click', async () => {
    const { user } = renderMemberPlan('/memberplans/create');

    await user.click(
      await screen.findByRole('button', {
        name: 'memberplanForm.configureTrialBtn',
      })
    );

    expect(extendable()).not.toBeChecked();
    expect(maxCount()).toHaveValue(1);
    expect(
      screen.getByText('memberplanForm.trialMemberplanAlert')
    ).toBeInTheDocument();
  });
});

describe('MemberPlanEditView', () => {
  it('is memoised by the React Compiler', () => {
    expect(MemberPlanEditForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('saves the loaded plan unchanged and stays on it', async () => {
    const { user, currentPath } = renderMemberPlan('/memberplans/edit/plan-1');

    await loaded();
    expect(slug()).toHaveValue('jahresabo');
    expect(
      screen.getByText('memberPlanEdit.editTitle', { exact: false })
    ).toBeInTheDocument();

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(wireFormat(updated.mock.calls[0][0])).toStrictEqual({
      id: 'plan-1',
      ...storedVariables,
    });
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/memberplans/edit/plan-1');
  });

  it('does not change the slug when the name of a stored plan changes', async () => {
    const { user } = renderMemberPlan('/memberplans/edit/plan-1');

    await loaded();
    await user.type(name(), ' Plus');

    expect(slug()).toHaveValue('jahresabo');
  });

  it('returns to the list on save and close', async () => {
    const { user, currentPath } = renderMemberPlan('/memberplans/edit/plan-1');

    await loaded();
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(currentPath()).toBe('/memberplans'));
    expect(updated).toHaveBeenCalledTimes(1);
  });

  it('lists the payment methods of the plan by name', async () => {
    renderMemberPlan('/memberplans/edit/plan-1');

    await loaded();

    const paymentConfigs = formSectionOf('memberPlanEdit.paymentConfigs');

    expect(await paymentConfigs.findByText('Rechnung')).toBeInTheDocument();
    expect(
      paymentConfigs.getByText('memberPlanList.paymentPeriodicity.yearly')
    ).toBeInTheDocument();
  });

  it('refuses a target amount below the minimum', async () => {
    const { user } = renderMemberPlan('/memberplans/edit/plan-1');

    await loaded();
    await user.clear(monthlyTarget());
    await user.type(monthlyTarget(), '5');
    await user.tab();
    await user.click(screen.getByTestId('saveButton'));

    expect(
      (
        await formSectionOf('memberplanForm.periodicityPricing').findAllByText(
          'memberPlanEdit.targetPriceMustBeGreaterThanMin'
        )
      ).length
    ).toBeGreaterThan(0);
    expect(updated).not.toHaveBeenCalled();
  });

  it('keeps a plan extendable while a payment setting forces renewal', async () => {
    const { user } = renderMemberPlan('/memberplans/edit/plan-1', {
      memberPlan: {
        ...storedMemberPlan,
        availablePaymentMethods: (
          storedMemberPlan.availablePaymentMethods ?? []
        ).map(availablePaymentMethod => ({
          ...availablePaymentMethod,
          forceAutoRenewal: true,
        })),
      },
    });

    await loaded();
    await user.click(extendable());

    expect(extendable()).toBeChecked();
    expect(
      await screen.findByText('memberplanForm.trialSubscriptionNotPossible')
    ).toBeInTheDocument();
  });

  it('refuses forced renewal on a plan that is not extendable', async () => {
    const { user } = renderMemberPlan('/memberplans/edit/plan-1', {
      memberPlan: { ...storedMemberPlan, extendable: false },
    });

    await loaded();
    await user.click(forceAutoRenewal());

    expect(forceAutoRenewal()).not.toBeChecked();
    expect(
      await screen.findByText('memberplanForm.forceAutoRenewNotPossible')
    ).toBeInTheDocument();
  });
});
