import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

interface ReviveInstance {
  refresh: () => void;
}

type ReviveWindow = Window & {
  reviveAsync?: Record<string, ReviveInstance>;
};

const REFRESH_DEBOUNCE_MS = 80;

const pendingReviveIds = new Set<string>();
let refreshTimer: ReturnType<typeof setTimeout> | undefined;

const runRefresh = () => {
  refreshTimer = undefined;
  const revive = (window as unknown as ReviveWindow).reviveAsync;
  if (!revive) {
    return;
  }
  const reviveIds = [...pendingReviveIds];
  pendingReviveIds.clear();
  for (const reviveId of reviveIds) {
    revive[reviveId]?.refresh();
  }
};

export const scheduleReviveRefresh = (reviveId: string) => {
  pendingReviveIds.add(reviveId);
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(runRefresh, REFRESH_DEBOUNCE_MS);
};

export const flushReviveRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  runRefresh();
};

export const isReviveAvailable = () =>
  !!(window as unknown as ReviveWindow).reviveAsync;

interface ReviveAdProps {
  zoneId: string;
  reviveId: string;
  onEmptyChange?: (isEmpty: boolean) => void;
}

export const ReviveAd = ({
  zoneId,
  reviveId,
  onEmptyChange,
}: ReviveAdProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onEmptyChangeRef = useRef(onEmptyChange);

  const router = useRouter();

  useEffect(() => {
    onEmptyChangeRef.current = onEmptyChange;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const mountSlot = () => {
      onEmptyChangeRef.current?.(false);
      const ins = document.createElement('ins');
      ins.setAttribute('data-revive-zoneid', zoneId);
      ins.setAttribute('data-revive-id', reviveId);
      ins.style.display = 'block';
      container.replaceChildren(ins);
      scheduleReviveRefresh(reviveId);
    };

    const reportEmptiness = (event: Event) => {
      const slot = container.querySelector('ins');
      const delivered = (event as CustomEvent<Record<string, unknown>>).detail;
      if (!slot?.id || !delivered || !(slot.id in delivered)) {
        return;
      }
      onEmptyChangeRef.current?.(!slot.hasChildNodes());
    };

    const completedEvent = `revive-${reviveId}-completed`;

    mountSlot();
    router.events.on('routeChangeComplete', mountSlot);
    document.addEventListener(completedEvent, reportEmptiness);

    return () => {
      router.events.off('routeChangeComplete', mountSlot);
      document.removeEventListener(completedEvent, reportEmptiness);
      container.replaceChildren();
    };
  }, [zoneId, reviveId, router]);

  return <div ref={containerRef} />;
};
