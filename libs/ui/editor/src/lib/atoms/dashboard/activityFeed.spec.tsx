import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { cloneElement, ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { toaster } from 'rsuite';

import { ACTIVITY_FILTER_STORAGE_KEY, ActivityFeed } from './activityFeed';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({
    i18nKey,
    components,
  }: {
    i18nKey: string;
    components: ReactElement[];
  }) => cloneElement(components[0], {}, i18nKey),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const longComment =
  'This is a long comment that keeps going far beyond what fits into a small tile on the dashboard, so the tile shows only the beginning of it.';

const actions = [
  {
    __typename: 'CommentCreatedAction',
    date: new Date('2026-10-10T10:00:00Z').toISOString(),
    comment: {
      id: 'comment-1',
      title: null,
      guestUsername: 'Anna Leserin',
      user: null,
      text: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: longComment }] },
        ],
      },
    },
  },
  {
    __typename: 'ArticleCreatedAction',
    date: new Date('2026-10-10T09:00:00Z').toISOString(),
    article: {
      id: 'article-1',
      createdAt: new Date('2026-10-10T09:00:00Z').toISOString(),
      url: 'https://example.com/a/article',
      latest: { title: 'A new article', socialMediaTitle: null },
    },
  },
];

const renderFeed = () =>
  render(
    <MemoryRouter>
      <ActivityFeed />
    </MemoryRouter>
  );

describe('ActivityFeed', () => {
  beforeEach(() => {
    mockedUseQuery.mockReturnValue({ data: { actions }, error: undefined });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows one tile per activity, newest first, each linking to its edit page', () => {
    renderFeed();

    const tiles = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(tiles).toHaveLength(2);
    expect(within(tiles[0]).getByRole('link').getAttribute('href')).toBe(
      '/comments/edit/comment-1'
    );
    expect(within(tiles[1]).getByRole('link').getAttribute('href')).toBe(
      '/articles/edit/article-1'
    );
  });

  it('shows who commented and the comment, with the full text in a tooltip', async () => {
    renderFeed();

    const [commentTile] = within(screen.getByRole('list')).getAllByRole(
      'listitem'
    );

    expect(within(commentTile).getByText('Anna Leserin')).toBeTruthy();
    expect(within(commentTile).getByText(longComment)).toBeTruthy();

    fireEvent.focus(within(commentTile).getByRole('link'));

    expect((await screen.findByRole('tooltip')).textContent).toContain(
      longComment
    );
  });

  it('shows no tooltip when the tile already shows everything', async () => {
    renderFeed();

    const [, articleTile] = within(screen.getByRole('list')).getAllByRole(
      'listitem'
    );
    fireEvent.focus(within(articleTile).getByRole('link'));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('scrolls the timeline step by step with the arrow buttons', () => {
    const scrollBy = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'scrollBy').mockImplementation(scrollBy);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(2000);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(600);

    renderFeed();

    const newer = screen.getByRole('button', {
      name: 'dashboard.newerActivity',
    });
    const older = screen.getByRole('button', {
      name: 'dashboard.olderActivity',
    });

    expect(newer.hasAttribute('disabled')).toBe(true);

    fireEvent.click(older);
    expect(scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);

    const track = screen.getByRole('list');
    Object.defineProperty(track, 'scrollLeft', { value: 216 });
    fireEvent.scroll(track);

    fireEvent.click(newer);
    expect(scrollBy.mock.calls[1][0].left).toBeLessThan(0);
  });

  describe('with the mouse', () => {
    let scrollLeft: number;
    let scrollBy: Mock;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
        setTimeout(() => callback(performance.now()), 16)
      );
      vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
      scrollBy = vi.fn();
      vi.spyOn(HTMLElement.prototype, 'scrollBy').mockImplementation(scrollBy);
      vi.spyOn(HTMLElement.prototype, 'scrollTo').mockImplementation(
        () => undefined
      );
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(
        2000
      );
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(
        600
      );

      renderFeed();

      scrollLeft = 0;
      Object.defineProperty(screen.getByRole('list'), 'scrollLeft', {
        configurable: true,
        get: () => scrollLeft,
        set: value => {
          scrollLeft = value;
        },
      });
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    const older = () =>
      screen.getByRole('button', { name: 'dashboard.olderActivity' });

    it('moves one tile on a short press', () => {
      fireEvent.pointerDown(older());
      vi.advanceTimersByTime(100);
      fireEvent.pointerUp(older());
      vi.advanceTimersByTime(500);

      expect(scrollBy).toHaveBeenCalledTimes(1);
      expect(scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);
      expect(scrollLeft).toBe(0);
    });

    it('keeps scrolling while the button is held, and stops on release', () => {
      fireEvent.pointerDown(older());
      vi.advanceTimersByTime(800);
      const whileHeld = scrollLeft;
      fireEvent.pointerUp(older());
      vi.advanceTimersByTime(500);

      expect(whileHeld).toBeGreaterThan(0);
      expect(scrollLeft).toBe(whileHeld);
      expect(scrollBy).not.toHaveBeenCalled();
    });
  });

  describe('filter', () => {
    const lastQueryTypes = () =>
      mockedUseQuery.mock.calls.at(-1)?.[1]?.variables?.types;

    afterEach(() => {
      localStorage.clear();
    });

    const openFilter = () =>
      fireEvent.click(
        screen.getByRole('button', { name: 'dashboard.activityFilter' })
      );

    it('asks for every kind of activity until the user filters', () => {
      renderFeed();

      expect(lastQueryTypes()).toBeUndefined();
    });

    it('asks only for the chosen kinds of activity and remembers them', async () => {
      renderFeed();
      openFilter();

      fireEvent.click(
        await screen.findByRole('checkbox', {
          name: 'dashboard.activityTypes.UserCreated',
        })
      );

      expect(lastQueryTypes()).toHaveLength(7);
      expect(lastQueryTypes()).not.toContain('UserCreated');
      expect(
        JSON.parse(localStorage.getItem(ACTIVITY_FILTER_STORAGE_KEY) ?? '[]')
      ).not.toContain('UserCreated');
    });

    it('restores the filter stored in this browser', () => {
      localStorage.setItem(
        ACTIVITY_FILTER_STORAGE_KEY,
        JSON.stringify(['CommentCreated'])
      );

      renderFeed();

      expect(lastQueryTypes()).toEqual(['CommentCreated']);
    });

    it('never lets the last kind be switched off', async () => {
      localStorage.setItem(
        ACTIVITY_FILTER_STORAGE_KEY,
        JSON.stringify(['CommentCreated'])
      );

      renderFeed();
      openFilter();

      expect(
        (
          await screen.findByRole('checkbox', {
            name: 'dashboard.activityTypes.CommentCreated',
          })
        ).hasAttribute('disabled')
      ).toBe(true);
    });

    it('stays reachable when nothing matches the filter', () => {
      localStorage.setItem(
        ACTIVITY_FILTER_STORAGE_KEY,
        JSON.stringify(['PollStarted'])
      );
      mockedUseQuery.mockReturnValue({
        data: { actions: [] },
        error: undefined,
      });

      renderFeed();

      expect(screen.getByText('dashboard.noActivity')).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'dashboard.activityFilter' })
      ).toBeTruthy();
    });
  });

  it('shows a short note instead of an error toast when activities cannot be loaded', () => {
    const push = vi.spyOn(toaster, 'push');
    mockedUseQuery.mockReturnValue({
      data: undefined,
      error: new Error('Forbidden'),
    });

    renderFeed();

    expect(screen.getByText('dashboard.activityUnavailable')).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it('says so when there is no activity yet', () => {
    mockedUseQuery.mockReturnValue({ data: { actions: [] }, error: undefined });

    renderFeed();

    expect(screen.getByText('dashboard.noActivity')).toBeTruthy();
  });
});
