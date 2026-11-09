import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  CreateCrowdfundingGoalInput,
  CrowdfundingGoalType,
} from '@wepublish/editor/api';
import { useState } from 'react';

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

  it('shows no empty table before the first goal is added', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <CrowdfundingGoalList
          goalType={CrowdfundingGoalType.Subscription}
          goals={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onUpdate={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.queryByRole('table')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'crowdfunding.goalsForm.add' })
    ).toBeTruthy();
  });

  describe('keeps keyboard focus when the list changes', () => {
    const StatefulList = () => {
      const [items, setItems] = useState<CreateCrowdfundingGoalInput[]>(goals);

      return (
        <ThemeProvider theme={createTheme({ cssVariables: true })}>
          <CrowdfundingGoalList
            goalType={CrowdfundingGoalType.Subscription}
            goals={items}
            onAdd={goal => setItems(current => [...current, goal])}
            onRemove={index =>
              setItems(current => current.filter((_, i) => i !== index))
            }
            onUpdate={vi.fn()}
          />
        </ThemeProvider>
      );
    };

    const press = (element: HTMLElement) => {
      element.focus();
      fireEvent.click(element);
    };

    const removeButtons = () =>
      screen.queryAllByRole('button', {
        name: 'crowdfunding.goalsForm.remove',
      });

    it('moves focus to the next goal after removing one', () => {
      render(<StatefulList />);

      expect(removeButtons()[0]).not.toHaveFocus();
      fireEvent.click(removeButtons()[0]);

      expect(removeButtons()).toHaveLength(1);
      expect(removeButtons()[0]).toHaveFocus();
    });

    it('falls back to the add button when the last goal is removed', () => {
      render(<StatefulList />);

      press(removeButtons()[1]);
      expect(removeButtons()[0]).toHaveFocus();

      press(removeButtons()[0]);
      expect(
        screen.getByRole('button', { name: 'crowdfunding.goalsForm.add' })
      ).toHaveFocus();
    });

    it('focuses the title of a newly added goal', () => {
      render(<StatefulList />);

      press(screen.getByRole('button', { name: 'crowdfunding.goalsForm.add' }));

      const titles = screen.getAllByRole('textbox', {
        name: 'crowdfunding.goalsForm.title',
      });
      expect(titles).toHaveLength(3);
      expect(titles[2]).toHaveFocus();
    });
  });
});
