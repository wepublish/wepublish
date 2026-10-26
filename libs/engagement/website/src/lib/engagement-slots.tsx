import styled from '@emotion/styled';
import { FullEngagementPromptFragment } from '@wepublish/website/api';
import {
  EngagementPrompt,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

/** The dismissals of this browser, read after hydration. */
export function useEngagementDismissals() {
  const [dismissals, setDismissals] = useState<EngagementDismissals>({});
  const [legacyBannerClosedAt, setLegacyBannerClosedAt] = useState<number>();

  useEffect(() => {
    setDismissals(readDismissals());
    setLegacyBannerClosedAt(readLegacyBannerClosedAt());
  }, []);

  const dismiss = useCallback((prompt: FullEngagementPromptFragment) => {
    setDismissals(storeDismissal(prompt));
  }, []);

  return { dismissals, legacyBannerClosedAt, dismiss };
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
    () => ({ primaryBanner: promptToBanner(prompt, t) }),
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
