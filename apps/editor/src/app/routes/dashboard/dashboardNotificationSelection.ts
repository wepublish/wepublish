import { NotificationSeverity, SEVERITY_ORDER } from '@wepublish/ui/editor';

export type DashboardNotificationCategory =
  'connector' | 'team' | 'changelog' | 'jobs';

export const DASHBOARD_NOTIFICATION_LIMIT = 4;

type WithSeverity = { props: { severity: NotificationSeverity } };

/**
 * Picks the notifications the dashboard has room for. Every category that has
 * something keeps its most severe item, so ten failing jobs can't push the one
 * team message off the dashboard; the remaining slots go to whatever is most
 * severe overall. The result is sorted by severity, equal severities keeping
 * the order the categories were given in.
 */
export function selectDashboardNotifications<T extends WithSeverity>(
  groups: { category: DashboardNotificationCategory; items: T[] }[],
  limit = DASHBOARD_NOTIFICATION_LIMIT
) {
  const sorted = groups
    .flatMap(({ category, items }) => items.map(item => ({ category, item })))
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.item.props.severity] -
        SEVERITY_ORDER[b.item.props.severity]
    );

  const picked = new Set<T>();
  const represented = new Set<DashboardNotificationCategory>();

  for (const { category, item } of sorted) {
    if (!represented.has(category)) {
      represented.add(category);
      picked.add(item);
    }
  }

  for (const { item } of sorted) {
    if (picked.size >= limit) {
      break;
    }

    picked.add(item);
  }

  return {
    visible: sorted.map(({ item }) => item).filter(item => picked.has(item)),
    hiddenCount: sorted.length - picked.size,
  };
}
