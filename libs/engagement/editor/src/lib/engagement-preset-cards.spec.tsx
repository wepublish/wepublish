import { createTheme, ThemeProvider } from '@mui/material';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { EngagementPlacement } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import { EngagementPresetCards } from './engagement-preset-cards';
import { RESTRICT_PREMIUM_PATH } from './presets';

const renderCards = (onPick = vi.fn()) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter>
        <EngagementPresetCards onPick={onPick} />
      </MemoryRouter>
    </ThemeProvider>
  );

const card = (preset: string) => {
  const element = screen
    .getByText(`engagement.preset.${preset}`)
    .closest<HTMLElement>('[data-preset]');

  if (!element) {
    throw new Error(`No card for ${preset}`);
  }

  return element;
};

describe('EngagementPresetCards', () => {
  it('shows the presets in a fixed order', () => {
    renderCards();

    expect(
      Array.from(document.querySelectorAll('[data-preset]')).map(element =>
        element.getAttribute('data-preset')
      )
    ).toEqual([
      'growNewsletter',
      'promoteMemberships',
      'restrictPremium',
      'displayAnnouncement',
    ]);
  });

  it('pictures where each preset shows its prompt', () => {
    renderCards();

    expect(
      within(card('growNewsletter'))
        .getByTestId('preset-illustration')
        .getAttribute('data-placement')
    ).toBe(EngagementPlacement.Modal);
    expect(
      within(card('promoteMemberships'))
        .getByTestId('preset-illustration')
        .getAttribute('data-placement')
    ).toBe(EngagementPlacement.Inline);
    expect(
      within(card('restrictPremium'))
        .getByTestId('preset-illustration')
        .getAttribute('data-placement')
    ).toBe(EngagementPlacement.Cutoff);
    expect(
      within(card('displayAnnouncement'))
        .getByTestId('preset-illustration')
        .getAttribute('data-placement')
    ).toBe(EngagementPlacement.Banner);
  });

  it('says who a preset is for and what it does step by step', () => {
    renderCards();

    const newsletter = within(card('growNewsletter'));
    expect(
      newsletter.getByText('engagement.audience.ANONYMOUS')
    ).toBeInTheDocument();
    expect(newsletter.getAllByRole('listitem')).toHaveLength(2);

    const announcement = within(card('displayAnnouncement'));
    expect(
      announcement.getByText('engagement.audience.ALL')
    ).toBeInTheDocument();
    expect(announcement.getAllByRole('listitem')).toHaveLength(1);

    const premium = within(card('restrictPremium'));
    expect(
      premium.getByText('engagement.preset.restrictPremiumAudience')
    ).toBeInTheDocument();
    expect(premium.getAllByRole('listitem')).toHaveLength(1);
  });

  it('starts the form with the picked preset', () => {
    const onPick = vi.fn();
    renderCards(onPick);

    fireEvent.click(screen.getByText('engagement.preset.promoteMemberships'));

    expect(onPick).toHaveBeenCalledWith('promoteMemberships');
  });

  it('opens a new enforced paywall to restrict premium content', () => {
    renderCards();

    expect(
      screen.getByRole('link', { name: /engagement.preset.restrictPremium\b/ })
    ).toHaveAttribute('href', RESTRICT_PREMIUM_PATH);
  });
});
