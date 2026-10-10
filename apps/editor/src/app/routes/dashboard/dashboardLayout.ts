export type DashboardCardId =
  | 'notifications'
  | 'network'
  | 'activity'
  | 'audience'
  | 'externalApps';

export type DashboardCardDefinition = {
  id: DashboardCardId;
  /** Sticky cards are always shown, in this slot of the two-column grid. */
  sticky?: { row: number; col: number };
};

// Sticky cards in slot order, then the default order of the configurable ones.
export const DASHBOARD_CARDS: DashboardCardDefinition[] = [
  { id: 'notifications', sticky: { row: 1, col: 1 } },
  { id: 'network', sticky: { row: 1, col: 2 } },
  { id: 'activity' },
  { id: 'audience' },
  { id: 'externalApps' },
];

export type DashboardLayout = {
  version: 1;
  /** Configurable cards only, in display order. */
  cards: { id: DashboardCardId; visible: boolean }[];
};

const stickyCards = DASHBOARD_CARDS.filter(card => card.sticky).sort(
  (a, b) => a.sticky!.row - b.sticky!.row || a.sticky!.col - b.sticky!.col
);

const configurableIds = DASHBOARD_CARDS.filter(card => !card.sticky).map(
  card => card.id
);

export const defaultDashboardLayout = (): DashboardLayout => ({
  version: 1,
  cards: configurableIds.map(id => ({ id, visible: true })),
});

export const normalizeDashboardLayout = (stored: unknown): DashboardLayout => {
  const cards = (stored as Partial<DashboardLayout> | null)?.cards;

  if ((stored as Partial<DashboardLayout> | null)?.version !== 1) {
    return defaultDashboardLayout();
  }

  if (!Array.isArray(cards)) {
    return defaultDashboardLayout();
  }

  const known = new Set<DashboardCardId>();
  const result: DashboardLayout['cards'] = [];

  for (const card of cards) {
    const id = card?.id as DashboardCardId;

    if (configurableIds.includes(id) && !known.has(id)) {
      known.add(id);
      result.push({ id, visible: card.visible !== false });
    }
  }

  for (const id of configurableIds) {
    if (!known.has(id)) {
      result.push({ id, visible: true });
    }
  }

  return { version: 1, cards: result };
};

export const visibleDashboardCards = (
  layout: DashboardLayout
): DashboardCardId[] => [
  ...stickyCards.map(card => card.id),
  ...layout.cards.filter(card => card.visible).map(card => card.id),
];

export const setDashboardCardVisible = (
  layout: DashboardLayout,
  id: DashboardCardId,
  visible: boolean
): DashboardLayout => ({
  ...layout,
  cards: layout.cards.map(card =>
    card.id === id ? { ...card, visible } : card
  ),
});

export const moveDashboardCard = (
  layout: DashboardLayout,
  id: DashboardCardId,
  beforeId: DashboardCardId
): DashboardLayout => {
  const from = layout.cards.findIndex(card => card.id === id);
  const to = layout.cards.findIndex(card => card.id === beforeId);

  if (from < 0 || to < 0 || from === to) {
    return layout;
  }

  const cards = [...layout.cards];
  const [moved] = cards.splice(from, 1);
  cards.splice(to, 0, moved);

  return { ...layout, cards };
};
