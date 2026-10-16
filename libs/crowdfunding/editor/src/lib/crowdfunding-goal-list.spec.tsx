import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { CrowdfundingGoalType } from '@wepublish/editor/api';

import { CrowdfundingGoalList } from './crowdfunding-goal-list';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const goals = [
  { title: 'Basis', description: 'The floor', amount: 120 },
  { title: 'Office', description: 'A room', amount: 300 },
];

const renderList = (goalType = CrowdfundingGoalType.Subscription) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <CrowdfundingGoalList
        goalType={goalType}
        goals={goals}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />
    </ThemeProvider>
  );

describe('CrowdfundingGoalList', () => {
  it('names each column once, however many goals there are', () => {
    renderList();

    expect(screen.getAllByRole('row')).toHaveLength(goals.length + 1);
    expect(screen.getAllByText('crowdfunding.goalsForm.title')).toHaveLength(1);
  });

  it('labels every input by the column it sits in', () => {
    renderList();

    expect(
      screen.getAllByRole('textbox', { name: 'crowdfunding.goalsForm.title' })
    ).toHaveLength(goals.length);
    expect(
      screen.getAllByRole('spinbutton', {
        name: 'crowdfunding.goalsForm.amountSubscriptions',
      })
    ).toHaveLength(goals.length);
  });

  it('labels the amount column by the goal type', () => {
    renderList(CrowdfundingGoalType.Revenue);

    expect(
      screen.getAllByRole('textbox', { name: 'crowdfunding.goalsForm.amount' })
    ).toHaveLength(goals.length);
  });

  it('removes a goal with an icon button that reads as destructive', () => {
    renderList();

    expect(
      screen.getAllByRole('button', {
        name: 'crowdfunding.goalsForm.remove',
      })[0]
    ).toHaveClass('MuiIconButton-colorError');
  });
});
