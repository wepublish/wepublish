import { useId } from 'react';

export function useTabPanel<T extends string | number>(selected: T) {
  const id = useId();
  const panelId = `${id}panel`;
  const tabId = (value: T) => `${id}tab-${value}`;

  return {
    tabProps: (value: T) => ({ id: tabId(value), 'aria-controls': panelId }),
    panelProps: {
      id: panelId,
      role: 'tabpanel',
      'aria-labelledby': tabId(selected),
    },
  };
}
