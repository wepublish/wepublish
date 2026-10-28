import styled from '@emotion/styled';
import { FullEngagementPromptFragment } from '@wepublish/website/api';
import {
  EngagementPrompt,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  LEGACY_BANNER_CLOSED_KEY,
  readDismissals,
  readLegacyBannerClosedAt,
  storeDismissal,
} from './engagement-storage';
import {
  engagementEvent,
  trackEngagement,
  trackImpressionOnce,
} from './engagement-tracking';
import { promptToBanner } from './prompt-to-banner';
import { EngagementDismissals } from './resolve-engagement';

type DismissalsSnapshot = {
  dismissals: EngagementDismissals;
  legacyBannerClosedAt?: number;
  /** When the snapshot was taken: the time dismissals are measured against. */
  now: number;
};

// The server knows no dismissals, so nothing it renders depends on the clock.
const serverSnapshot: DismissalsSnapshot = { dismissals: {}, now: 0 };
const listeners = new Set<() => void>();
// Read once while mounted, so every render gets the same object; dropped
// when the last reader unmounts, so the next one reads storage afresh.
let snapshot: DismissalsSnapshot | undefined;

const takeSnapshot = (dismissals = readDismissals()): DismissalsSnapshot => ({
  dismissals,
  legacyBannerClosedAt: readLegacyBannerClosedAt(),
  now: Date.now(),
});

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);

    if (!listeners.size) {
      snapshot = undefined;
    }
  };
};

const getSnapshot = () => (snapshot ??= takeSnapshot());

/** The dismissals of this browser, read after hydration. */
export function useEngagementDismissals() {
  const { dismissals, legacyBannerClosedAt, now } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverSnapshot
  );

  const dismiss = useCallback((prompt: FullEngagementPromptFragment) => {
    snapshot = takeSnapshot(storeDismissal(prompt));
    listeners.forEach(listener => listener());
  }, []);

  return { dismissals, legacyBannerClosedAt, now, dismiss };
}

export type EngagementPromptSlotProps = {
  prompt: FullEngagementPromptFragment;
  onDismiss: (prompt: FullEngagementPromptFragment) => void;
  className?: string;
};

/** The `EngagementPrompt` builder component, tracked. */
export function EngagementPromptSlot({
  prompt,
  onDismiss,
  className,
}: EngagementPromptSlotProps) {
  useEffect(() => trackImpressionOnce(prompt), [prompt]);

  return (
    <EngagementPrompt
      className={className}
      prompt={prompt}
      onDismiss={
        prompt.stage.dismissible ?
          () => {
            trackEngagement(engagementEvent('dismiss', prompt));
            onDismiss(prompt);
          }
        : undefined
      }
      onAction={() => trackEngagement(engagementEvent('click', prompt))}
    />
  );
}

// No box of its own, so the sticky banner inside stays sticky.
const BannerTracking = styled('div')`
  display: contents;
`;

export type EngagementBannerSlotProps = {
  prompt: FullEngagementPromptFragment;
  tags?: string[];
  className?: string;
};

/**
 * A banner prompt in the `Banner` builder component. It remembers its closing
 * in the key of older releases, which `resolveEngagement` reads.
 */
export function EngagementBannerSlot({
  prompt,
  tags,
  className,
}: EngagementBannerSlotProps) {
  const { t } = useTranslation();
  const { Banner } = useWebsiteBuilder();
  const closedBefore = useRef<string | null>(null);
  const data = useMemo(
    () => ({
      __typename: 'Query' as const,
      primaryBanner: promptToBanner(prompt, t),
    }),
    [prompt, t]
  );

  useEffect(() => trackImpressionOnce(prompt), [prompt]);

  return (
    <BannerTracking
      onClickCapture={() => {
        closedBefore.current = localStorage.getItem(LEGACY_BANNER_CLOSED_KEY);
      }}
      onClick={event => {
        if (
          localStorage.getItem(LEGACY_BANNER_CLOSED_KEY) !==
          closedBefore.current
        ) {
          trackEngagement(engagementEvent('dismiss', prompt));
        } else if ((event.target as Element).closest('a, button')) {
          trackEngagement(engagementEvent('click', prompt));
        }
      }}
    >
      <Banner
        data={data}
        loading={false}
        tags={tags}
        className={className}
      />
    </BannerTracking>
  );
}
