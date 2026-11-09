import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { SelectMemberPlan } from './selectMemberPlan';
import { SelectMemberPlans } from './selectMemberPlans';

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: undefined, refetch: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

describe('SelectMemberPlans', () => {
  it('names its input with the label it is given', () => {
    render(
      <ThemeProvider theme={theme}>
        <SelectMemberPlans
          label="Member plans"
          defaultMemberPlans={[]}
          setSelectedMemberPlans={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('combobox', { name: 'Member plans' })).toBeTruthy();
  });

  it('can be named by a label rendered elsewhere', () => {
    render(
      <ThemeProvider theme={theme}>
        <span id="plans-label">Available plans</span>
        <SelectMemberPlans
          aria-labelledby="plans-label"
          defaultMemberPlans={[]}
          setSelectedMemberPlans={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('combobox', { name: 'Available plans' })
    ).toBeTruthy();
  });
});

describe('SelectMemberPlan', () => {
  it('names its input with the label it is given', () => {
    render(
      <ThemeProvider theme={theme}>
        <SelectMemberPlan
          label="Member plan"
          setSelectedMemberPlan={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('combobox', { name: 'Member plan' })).toBeTruthy();
  });

  it('can be named by a label rendered elsewhere', () => {
    render(
      <ThemeProvider theme={theme}>
        <span id="plan-label">Plan</span>
        <SelectMemberPlan
          aria-labelledby="plan-label"
          setSelectedMemberPlan={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('combobox', { name: 'Plan' })).toBeTruthy();
  });
});
