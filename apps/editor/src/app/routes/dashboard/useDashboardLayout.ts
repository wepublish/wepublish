import { useCallback, useState } from 'react';

import {
  DashboardLayout,
  defaultDashboardLayout,
  normalizeDashboardLayout,
} from './dashboardLayout';

export const DASHBOARD_LAYOUT_STORAGE_KEY = 'wepublish/dashboardLayout';

const readStoredLayout = (): DashboardLayout => {
  try {
    const stored = window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);

    return normalizeDashboardLayout(stored ? JSON.parse(stored) : null);
  } catch {
    return defaultDashboardLayout();
  }
};

export const useDashboardLayout = () => {
  const [layout, setLayout] = useState(readStoredLayout);

  const updateLayout = useCallback((next: DashboardLayout) => {
    setLayout(next);

    try {
      window.localStorage.setItem(
        DASHBOARD_LAYOUT_STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch {
      // storage unavailable (private mode, quota) - keep the layout for this visit
    }
  }, []);

  return [layout, updateLayout] as const;
};
