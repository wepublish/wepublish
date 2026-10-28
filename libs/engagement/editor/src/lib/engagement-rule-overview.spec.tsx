import { createTheme, ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { EngagementRuleOverview } from './engagement-rule-overview';
import { ENGAGEMENT_PRESETS } from './presets';

const renderOverview = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <EngagementRuleOverview
        rule={{ ...ENGAGEMENT_PRESETS.growNewsletter(), name: 'Grow' }}
        actions={<button type="button">confirm</button>}
      />
    </ThemeProvider>
  );

describe('EngagementRuleOverview', () => {
  it('lays out the rule beside its steps, like the form', () => {
    renderOverview();

    const rule = screen.getByTestId('overview-rule');
    const steps = screen.getByTestId('overview-steps');

    expect(rule).toHaveTextContent('Grow');
    expect(within(rule).getByText('confirm')).toBeInTheDocument();
    expect(rule).not.toContainElement(steps);
  });

  it('gives each step its own card, with the sketch and the preview', () => {
    renderOverview();

    const steps = within(screen.getByTestId('overview-steps')).getAllByTestId(
      'overview-step'
    );

    expect(steps).toHaveLength(2);
    expect(
      steps[0].querySelector('[data-testid="preset-illustration"]')
    ).not.toBeNull();
  });
});
