import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { CrowdfundingGoalType } from '@wepublish/editor/api';
import { CrowdfundingForm, CrowdfundingFormValues } from './crowdfunding-form';
import { createTheme, Stack, ThemeProvider } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { ReactNode } from 'react';

const theme = createTheme({ cssVariables: true });

const Form = ({
  goalType,
  children,
}: {
  goalType: CrowdfundingGoalType;
  children: ReactNode;
}) => {
  const form = useForm<CrowdfundingFormValues>({
    defaultValues: {
      name: 'Test',
      goalType,
      additionalRevenue: 0,
      memberPlans: [],
      goals: [{ title: 'Goal', description: '', amount: 0 }],
    },
  });

  return <FormProvider {...form}>{children}</FormProvider>;
};

const renderForm = (goalType: CrowdfundingGoalType) =>
  render(
    <ThemeProvider theme={theme}>
      <MockedProvider
        mocks={[]}
        addTypename={false}
      >
        <Form goalType={goalType}>
          <Stack
            spacing={3}
            sx={{ width: '100%' }}
          >
            <CrowdfundingForm />
          </Stack>
        </Form>
      </MockedProvider>
    </ThemeProvider>
  );

describe('CrowdfundingForm', () => {
  describe('the goals', () => {
    it('labels every goal field', () => {
      renderForm(CrowdfundingGoalType.Subscription);

      expect(
        screen.getByRole('textbox', { name: 'crowdfunding.goalsForm.title' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('textbox', {
          name: 'crowdfunding.goalsForm.description',
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('spinbutton', {
          name: 'crowdfunding.goalsForm.amountSubscriptions',
        })
      ).toBeInTheDocument();
    });

    it('removes a goal with an icon button that reads as destructive', () => {
      renderForm(CrowdfundingGoalType.Subscription);

      const remove = screen.getByRole('button', {
        name: 'crowdfunding.goalsForm.remove',
      });

      expect(remove).toHaveClass('MuiIconButton-colorError');
    });
  });

  describe('Subscription goal type', () => {
    it('labels the goal amount column as the subscription count target', () => {
      renderForm(CrowdfundingGoalType.Subscription);

      expect(
        screen.getAllByText('crowdfunding.goalsForm.amountSubscriptions')
      ).not.toHaveLength(0);
      expect(
        screen.queryAllByText('crowdfunding.goalsForm.amount')
      ).toHaveLength(0);
    });

    it('renders the external revenue field as a plain number input (no CHF)', () => {
      const { container } = renderForm(CrowdfundingGoalType.Subscription);

      expect(
        screen.getByRole('spinbutton', {
          name: 'crowdfunding.form.additionalSubscriptions',
        })
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
        screen.getAllByText('crowdfunding.goalsForm.amount')
      ).not.toHaveLength(0);
      expect(
        screen.queryAllByText('crowdfunding.goalsForm.amountSubscriptions')
      ).toHaveLength(0);
    });

    it('renders the external revenue field as a CHF currency input', () => {
      renderForm(CrowdfundingGoalType.Revenue);

      expect(
        screen.getByRole('textbox', {
          name: 'crowdfunding.form.additionalRevenue',
        })
      ).toBeInTheDocument();
      expect(screen.getByText('CHF')).toBeInTheDocument();
    });
  });
});
