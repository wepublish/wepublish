import { render, screen } from '@testing-library/react';

import { SelectMemberPlan } from './selectMemberPlan';

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    data: {
      memberPlans: {
        nodes: [{ id: 'plan-1', name: 'Jahresabo' }],
        totalCount: 1,
      },
    },
    refetch: vi.fn(),
  }),
}));

describe('SelectMemberPlan', () => {
  it('names the combobox after its label and shows the helper text', () => {
    render(
      <SelectMemberPlan
        label="Subscription plan"
        helperText="Please enter a subscription plan"
        error
        selectedMemberPlan="plan-1"
        setSelectedMemberPlan={vi.fn()}
      />
    );

    expect(
      screen.getByRole('combobox', { name: 'Subscription plan' })
    ).toHaveValue('Jahresabo');
    expect(
      screen.getByText('Please enter a subscription plan')
    ).toBeInTheDocument();
  });
});
