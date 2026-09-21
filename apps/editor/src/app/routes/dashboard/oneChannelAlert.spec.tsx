import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  OneChannelConnectionState,
  useOneChannelStatusQuery,
} from '@wepublish/editor/api';

import { OneChannelAlert } from './oneChannelAlert';

// Partial mock: the UI library imports enums from the same module.
vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useOneChannelStatusQuery: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseOneChannelStatusQuery = useOneChannelStatusQuery as Mock;

const mockStatus = (
  status: {
    state: OneChannelConnectionState;
    unreachable: boolean;
    lastSuccessAt?: string | null;
  } | null
) => {
  mockedUseOneChannelStatusQuery.mockReturnValue({
    data:
      status ?
        {
          oneChannelStatus: {
            oneUrl: 'https://one.wepublish.ch',
            lastAttemptAt: null,
            lastError: null,
            lastSuccessAt: null,
            ...status,
          },
        }
      : undefined,
    loading: false,
  });
};

describe('OneChannelAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while the connector is not configured', () => {
    mockStatus({
      state: OneChannelConnectionState.NotConfigured,
      unreachable: false,
    });

    const { container } = render(<OneChannelAlert />);

    expect(container.innerHTML).toBe('');
  });

  it('renders nothing while contact is recent', () => {
    mockStatus({
      state: OneChannelConnectionState.Connected,
      unreachable: false,
      lastSuccessAt: '2026-09-16T12:00:00.000Z',
    });

    const { container } = render(<OneChannelAlert />);

    expect(container.innerHTML).toBe('');
  });

  it('renders nothing before the query has answered', () => {
    mockStatus(null);

    const { container } = render(<OneChannelAlert />);

    expect(container.innerHTML).toBe('');
  });

  it('renders an error once the connector is unreachable', () => {
    mockStatus({
      state: OneChannelConnectionState.Failing,
      unreachable: true,
      lastSuccessAt: '2026-09-16T12:00:00.000Z',
    });

    render(<OneChannelAlert />);

    expect(screen.getByText('oneChannel.outageTitle')).toBeTruthy();
    expect(screen.getByText(/oneChannel\.outageText/)).toBeTruthy();
  });

  it('reports its visibility to the surrounding panel', () => {
    const onVisibilityChange = vi.fn();

    mockStatus({
      state: OneChannelConnectionState.Connected,
      unreachable: false,
    });

    const { rerender } = render(
      <OneChannelAlert onVisibilityChange={onVisibilityChange} />
    );

    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);

    mockStatus({
      state: OneChannelConnectionState.Failing,
      unreachable: true,
    });

    rerender(<OneChannelAlert onVisibilityChange={onVisibilityChange} />);

    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
  });

  it('says so when there was never any contact', () => {
    mockStatus({
      state: OneChannelConnectionState.Failing,
      unreachable: true,
      lastSuccessAt: null,
    });

    render(<OneChannelAlert />);

    expect(screen.getByText('oneChannel.outageTextNever')).toBeTruthy();
  });
});
