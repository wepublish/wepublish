import { NotificationSeverity } from '@wepublish/ui/editor';

import { selectDashboardNotifications } from './dashboardNotificationSelection';

const item = (id: string, severity: NotificationSeverity) => ({
  id,
  props: { severity },
});

const ids = (items: { id: string }[]) => items.map(({ id }) => id);

it('shows everything while there is room', () => {
  const { visible, hiddenCount } = selectDashboardNotifications(
    [
      { category: 'jobs', items: [item('job', 'error')] },
      { category: 'team', items: [item('team', 'info')] },
    ],
    4
  );

  expect(ids(visible)).toEqual(['job', 'team']);
  expect(hiddenCount).toBe(0);
});

it('keeps one item of every category visible, however many errors another has', () => {
  const jobs = Array.from({ length: 10 }, (_, index) =>
    item(`job-${index}`, 'error')
  );

  const { visible, hiddenCount } = selectDashboardNotifications(
    [
      { category: 'team', items: [item('team', 'info')] },
      { category: 'changelog', items: [item('news', 'info')] },
      { category: 'jobs', items: jobs },
    ],
    4
  );

  expect(ids(visible)).toEqual(['job-0', 'job-1', 'team', 'news']);
  expect(hiddenCount).toBe(8);
});

it('represents a category by its most severe item', () => {
  const { visible } = selectDashboardNotifications(
    [
      {
        category: 'jobs',
        items: [item('job-a', 'error'), item('job-b', 'error')],
      },
      {
        category: 'changelog',
        items: [item('news', 'info'), item('action', 'warning')],
      },
    ],
    2
  );

  expect(ids(visible)).toEqual(['job-a', 'action']);
});

it('sorts by severity and keeps source order among equals', () => {
  const { visible } = selectDashboardNotifications(
    [
      { category: 'connector', items: [item('connector', 'error')] },
      { category: 'team', items: [item('team', 'success')] },
      { category: 'changelog', items: [item('news', 'info')] },
      { category: 'jobs', items: [item('job', 'error')] },
    ],
    4
  );

  expect(ids(visible)).toEqual(['connector', 'job', 'news', 'team']);
});

it('ignores empty categories', () => {
  const { visible, hiddenCount } = selectDashboardNotifications(
    [
      { category: 'connector', items: [] },
      { category: 'jobs', items: [] },
    ],
    4
  );

  expect(visible).toEqual([]);
  expect(hiddenCount).toBe(0);
});
