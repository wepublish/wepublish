import { createTheme, ThemeProvider } from '@mui/material';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MailEmailSegment } from '@wepublish/editor/api';

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

  it('offers no placeholder status when the medium has no placeholder pattern', () => {
    renderFilter({
      segmentCounts: [{ segment: MailEmailSegment.Active, userCount: 7 }],
    });

    expect(
      within(statusGroup()).queryByRole('button', {
        name: /mailSend\.emailSegments\.placeholder/,
      })
    ).toBeNull();
    expect(
      screen.getByText('mailSend.emailSegments.hintWithoutPlaceholder')
    ).toBeTruthy();
  });

  it('holds the placeholder status back until the counts say it exists', () => {
    renderFilter({ segmentCounts: undefined });

    expect(
      within(statusGroup()).queryByRole('button', {
        name: 'mailSend.emailSegments.placeholder',
      })
    ).toBeNull();
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
