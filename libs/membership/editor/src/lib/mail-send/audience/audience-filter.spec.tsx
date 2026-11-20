import { createTheme, ThemeProvider } from '@mui/material';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MailEmailSegment, MailRecipientBase } from '@wepublish/editor/api';

import { AudienceFilter, AudienceFilterProps } from './audience-filter';
import { INITIAL_AUDIENCE_STATE } from './audience-state';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined }),
}));

vi.mock('../email-quality-refresh-button', () => ({
  EmailQualityRefreshButton: () => <button>refresh</button>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const enabledFeatures = new Set<string>();

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useFeature: (feature: string) => enabledFeatures.has(feature),
}));

const renderFilter = (overrides: Partial<AudienceFilterProps> = {}) => {
  const onChange = vi.fn();

  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <AudienceFilter
        state={INITIAL_AUDIENCE_STATE}
        onChange={onChange}
        segmentCounts={[
          { segment: MailEmailSegment.Placeholder, userCount: 3 },
          { segment: MailEmailSegment.Active, userCount: 7 },
        ]}
        {...overrides}
      />
    </ThemeProvider>
  );

  return { onChange };
};

const statusGroup = () =>
  screen.getByRole('group', { name: 'mailSend.emailSegments.label' });

describe('AudienceFilter email status', () => {
  afterEach(cleanup);

  it('offers every status as one toggle, with how many people have it', () => {
    renderFilter();

    expect(
      within(statusGroup())
        .getAllByRole('button')
        .filter(button => button.hasAttribute('aria-pressed'))
        .map(button => button.textContent)
    ).toEqual([
      'mailSend.emailSegments.active: 7',
      'mailSend.emailSegments.unresponsive: 0',
      'mailSend.emailSegments.unknown: 0',
      'mailSend.emailSegments.placeholder: 3',
      'mailSend.emailSegments.dead: 0',
    ]);
  });

  it('adds a status to the audience when pressed', () => {
    const { onChange } = renderFilter();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'mailSend.emailSegments.placeholder: 3',
      })
    );

    expect(onChange).toHaveBeenCalledWith({
      emailSegments: [MailEmailSegment.Placeholder],
    });
  });

  it('shows the chosen statuses as pressed, and drops one pressed again', () => {
    const { onChange } = renderFilter({
      state: {
        ...INITIAL_AUDIENCE_STATE,
        emailSegments: [MailEmailSegment.Placeholder, MailEmailSegment.Dead],
      },
    });

    const placeholder = screen.getByRole('button', {
      name: 'mailSend.emailSegments.placeholder: 3',
    });

    expect(placeholder.getAttribute('aria-pressed')).toBe('true');
    expect(
      screen
        .getByRole('button', { name: 'mailSend.emailSegments.active: 7' })
        .getAttribute('aria-pressed')
    ).toBe('false');

    fireEvent.click(placeholder);

    expect(onChange).toHaveBeenCalledWith({
      emailSegments: [MailEmailSegment.Dead],
    });
  });

  it('names the statuses alone while their counts are not known yet', () => {
    renderFilter({ segmentCounts: undefined });

    expect(
      screen.getByRole('button', { name: 'mailSend.emailSegments.active' })
    ).toBeTruthy();
  });

  it('keeps the refresh of the statuses next to them', () => {
    renderFilter();

    expect(
      within(statusGroup()).getByRole('button', { name: 'refresh' })
    ).toBeTruthy();
  });
});

describe('AudienceFilter legacy subscriptions', () => {
  afterEach(() => {
    cleanup();
    enabledFeatures.clear();
  });

  const legacySelect = () =>
    screen.queryByRole('combobox', { name: 'mailSend.isLegacy' });

  const subscriptionBases = [
    MailRecipientBase.HasSubscription,
    MailRecipientBase.EndedSubscription,
  ];

  it('offers no legacy filter while the feature is off', () => {
    for (const base of subscriptionBases) {
      renderFilter({ state: { ...INITIAL_AUDIENCE_STATE, base } });

      expect(legacySelect()).not.toBeInTheDocument();
      cleanup();
    }
  });

  it('narrows subscribers and win-back to legacy subscriptions with the feature on', () => {
    enabledFeatures.add('legacy-subscriptions');

    for (const base of subscriptionBases) {
      const { onChange } = renderFilter({
        state: { ...INITIAL_AUDIENCE_STATE, base },
      });

      fireEvent.mouseDown(legacySelect() as HTMLElement);
      fireEvent.click(screen.getByRole('option', { name: 'mailSend.yes' }));

      expect(onChange).toHaveBeenCalledWith({ isLegacy: 'true' });
      cleanup();
    }
  });

  it('has no legacy filter for audiences that are not about subscriptions', () => {
    enabledFeatures.add('legacy-subscriptions');
    renderFilter();

    expect(legacySelect()).not.toBeInTheDocument();
  });
});
