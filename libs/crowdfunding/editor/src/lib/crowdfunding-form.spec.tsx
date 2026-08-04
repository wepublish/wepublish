import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { Form } from 'rsuite';
import { CrowdfundingGoalType } from '@wepublish/editor/api';
import { CrowdfundingForm } from './crowdfunding-form';

const renderForm = (goalType: CrowdfundingGoalType) =>
  render(
    <MockedProvider
      mocks={[]}
      addTypename={false}
    >
      <Form>
        <CrowdfundingForm
          crowdfunding={{
            name: 'Test',
            goalType,
            additionalRevenue: 0,
            goals: [{ title: 'Goal', description: '', amount: 0 }],
          }}
          onChange={jest.fn()}
          onAddGoal={jest.fn()}
          onRemoveGoal={jest.fn()}
        />
      </Form>
    </MockedProvider>
  );

describe('CrowdfundingForm', () => {
  describe('Subscription goal type', () => {
    it('labels the goal amount column as the subscription count target', () => {
      renderForm(CrowdfundingGoalType.Subscription);

      expect(
        screen.getByText('crowdfunding.goalsForm.amountSubscriptions')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('crowdfunding.goalsForm.amount')
      ).not.toBeInTheDocument();
    });

    it('renders the external revenue field as a plain number input (no CHF)', () => {
      const { container } = renderForm(CrowdfundingGoalType.Subscription);

      expect(
        screen.getByText('crowdfunding.form.additionalSubscriptions')
      ).toBeInTheDocument();

      const input = container.querySelector('input[name="additionalRevenue"]');
      expect(input).toHaveAttribute('type', 'number');
      expect(screen.queryByText('CHF')).not.toBeInTheDocument();
    });
  });

  describe('Revenue goal type', () => {
    it('labels the goal amount column as the target amount', () => {
      renderForm(CrowdfundingGoalType.Revenue);

      expect(
        screen.getByText('crowdfunding.goalsForm.amount')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('crowdfunding.goalsForm.amountSubscriptions')
      ).not.toBeInTheDocument();
    });

    it('renders the external revenue field as a CHF currency input', () => {
      renderForm(CrowdfundingGoalType.Revenue);

      expect(
        screen.getByText('crowdfunding.form.additionalRevenue')
      ).toBeInTheDocument();
      expect(screen.getByText('CHF')).toBeInTheDocument();
    });
  });
});
