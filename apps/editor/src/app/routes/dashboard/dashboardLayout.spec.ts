import {
  DASHBOARD_CARDS,
  defaultDashboardLayout,
  isDashboardCardFullWidth,
  moveDashboardCard,
  normalizeDashboardLayout,
  setDashboardCardFullWidth,
  setDashboardCardVisible,
  visibleDashboardCards,
} from './dashboardLayout';

const configurable = DASHBOARD_CARDS.filter(card => !card.sticky).map(
  card => card.id
);

describe('dashboard layout', () => {
  it('puts the sticky cards first, in their slot order, then every other card', () => {
    expect(visibleDashboardCards(defaultDashboardLayout())).toEqual([
      'notifications',
      'network',
      ...configurable,
    ]);
  });

  it('pins notifications to row 1 column 1 and the network to row 1 column 2', () => {
    expect(
      DASHBOARD_CARDS.filter(card => card.sticky).map(({ id, sticky }) => ({
        id,
        ...sticky,
      }))
    ).toEqual([
      { id: 'notifications', row: 1, col: 1 },
      { id: 'network', row: 1, col: 2 },
    ]);
  });

  it('shows the activity feed by default', () => {
    expect(visibleDashboardCards(defaultDashboardLayout())).toContain(
      'activity'
    );
  });

  it('skips hidden cards', () => {
    const layout = setDashboardCardVisible(
      defaultDashboardLayout(),
      'audience',
      false
    );

    expect(visibleDashboardCards(layout)).not.toContain('audience');
  });

  it('never hides a sticky card', () => {
    const layout = setDashboardCardVisible(
      defaultDashboardLayout(),
      'network',
      false
    );

    expect(visibleDashboardCards(layout)).toContain('network');
  });

  it('keeps the stored order and appends cards added in a later release', () => {
    const layout = normalizeDashboardLayout({
      version: 1,
      cards: [
        { id: 'audience', visible: true },
        { id: 'activity', visible: false },
      ],
    });

    expect(layout.cards).toEqual([
      { id: 'audience', visible: true },
      { id: 'activity', visible: false },
      ...configurable
        .filter(id => id !== 'audience' && id !== 'activity')
        .map(id => ({ id, visible: true })),
    ]);
  });

  it('drops unknown, duplicated and sticky ids from storage', () => {
    const layout = normalizeDashboardLayout({
      version: 1,
      cards: [
        { id: 'removedCard', visible: true },
        { id: 'network', visible: false },
        { id: 'audience', visible: false },
        { id: 'audience', visible: true },
      ],
    });

    expect(layout.cards.map(card => card.id)).toEqual([
      'audience',
      ...configurable.filter(id => id !== 'audience'),
    ]);
    expect(layout.cards[0].visible).toBe(false);
  });

  it.each([null, 'garbage', { version: 2, cards: [] }, { cards: 'x' }])(
    'falls back to the default layout for %j',
    stored => {
      expect(normalizeDashboardLayout(stored)).toEqual(
        defaultDashboardLayout()
      );
    }
  );

  it('lets the activity feed span the full width, and only the activity feed', () => {
    let layout = setDashboardCardFullWidth(
      defaultDashboardLayout(),
      'activity',
      true
    );
    layout = setDashboardCardFullWidth(layout, 'audience', true);

    expect(isDashboardCardFullWidth(layout, 'activity')).toBe(true);
    expect(isDashboardCardFullWidth(layout, 'audience')).toBe(false);
    expect(
      DASHBOARD_CARDS.filter(card => card.canSpanFullWidth).map(card => card.id)
    ).toEqual(['activity']);
  });

  it('keeps the full width of the activity feed in storage, but not of other cards', () => {
    const layout = normalizeDashboardLayout({
      version: 1,
      cards: [
        { id: 'activity', visible: true, fullWidth: true },
        { id: 'audience', visible: true, fullWidth: true },
      ],
    });

    expect(isDashboardCardFullWidth(layout, 'activity')).toBe(true);
    expect(isDashboardCardFullWidth(layout, 'audience')).toBe(false);
  });

  it('moves a card to another position', () => {
    const [first, second] = configurable;
    const layout = moveDashboardCard(defaultDashboardLayout(), second, first);

    expect(layout.cards.slice(0, 2).map(card => card.id)).toEqual([
      second,
      first,
    ]);
  });
});
