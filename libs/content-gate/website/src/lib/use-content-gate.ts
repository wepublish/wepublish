import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { useActiveSubscriptions } from '@wepublish/membership/website';
import {
  ArticleUnlockedDocument,
  ContentGateAudience,
  FullArticleFragment,
} from '@wepublish/website/api';
import { useEffect, useState } from 'react';
import {
  ContentGateMeter,
  ContentGateState,
  decideContentGate,
} from './content-gate-meter';
import { detectNewsletterVisit } from './newsletter-visit';

export const CONTENT_GATE_METER_KEY = 'content-gate-meter';

const readMeter = (): ContentGateMeter | null => {
  try {
    return JSON.parse(localStorage.getItem(CONTENT_GATE_METER_KEY) ?? 'null');
  } catch {
    return null;
  }
};

/**
 * Meters the reader and, unless the hard gate applies, fetches the blocks
 * the api left out of the article. `state` is null while nothing is decided.
 */
export function useContentGate(
  article:
    | Pick<FullArticleFragment, 'id' | 'contentGate' | 'latest'>
    | null
    | undefined
) {
  const { hasUser } = useUser();
  const activeSubscriptions = useActiveSubscriptions();
  const [state, setState] = useState<ContentGateState | null>(null);

  const gate = article?.contentGate;
  const forNonSubscribers =
    gate?.audience === ContentGateAudience.NonSubscribers;
  const exempt =
    hasUser && (!forNonSubscribers || !!activeSubscriptions?.length);
  const waitingForSubscriptions =
    hasUser && forNonSubscribers && activeSubscriptions == null;

  useEffect(() => {
    if (!gate || !article) {
      setState(null);
      return;
    }

    if (exempt) {
      setState('none');
      return;
    }

    if (waitingForSubscriptions) {
      return;
    }

    const result = decideContentGate({
      gate,
      meter: readMeter(),
      articleId: article.id,
      isNewsletterVisit: detectNewsletterVisit(
        gate.newsletterParams,
        window.location.search
      ),
      now: Date.now(),
    });

    localStorage.setItem(CONTENT_GATE_METER_KEY, JSON.stringify(result.meter));
    setState(result.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate?.id, article?.id, exempt, waitingForSubscriptions]);

  const unlock =
    !!article?.latest.contentGated && (state === 'none' || state === 'soft');

  const { data } = useQuery(ArticleUnlockedDocument, {
    variables: { id: article?.id ?? '' },
    skip: !unlock,
  });

  return {
    state,
    gate,
    unlockedBlocks: unlock ? data?.article?.latest.blocks : undefined,
  };
}
