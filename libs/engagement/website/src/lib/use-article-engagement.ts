import { useMutation } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { useActiveSubscriptions } from '@wepublish/membership/website';
import {
  getPaywallBypassToken,
  setArticleAccess,
  useArticleAccess,
} from '@wepublish/paywall/website';
import {
  FullEngagementPromptFragment,
  ViewArticleDocument,
} from '@wepublish/website/api';
import { useEffect, useState } from 'react';
import { readMeterToken, storeMeterToken } from './engagement-storage';
import { referralFromUrl } from './referral';

/**
 * Tells the server that the reader opens an article (`viewArticle`): it meters
 * them, decides their access and answers the prompts. When access is granted,
 * the article it answers carries every block, which Apollo writes over the cut
 * blocks of `ArticleDocument`.
 *
 * Runs in an effect, never while prefetching, and again once the reader logs
 * in or their subscriptions change.
 */
export function useArticleEngagement(article?: { id: string } | null) {
  const articleId = article?.id;
  const { user } = useUser();
  const subscriptions = useActiveSubscriptions();
  const [viewArticle] = useMutation(ViewArticleDocument);
  const [prompts, setPrompts] = useState<{
    articleId: string;
    prompts: FullEngagementPromptFragment[];
  }>();
  const access = useArticleAccess(articleId);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    let current = true;

    viewArticle({
      variables: {
        input: {
          articleId,
          meterToken: readMeterToken(),
          referral: referralFromUrl(window.location.href),
          paywallBypassToken: getPaywallBypassToken(),
        },
      },
    })
      .then(({ data }) => {
        if (!current || !data) {
          return;
        }

        const { meterToken, access, prompts } = data.viewArticle;

        if (meterToken) {
          storeMeterToken(meterToken);
        }

        setArticleAccess(articleId, access);
        setPrompts({ articleId, prompts });
      })
      .catch(() => {
        // The blocks stay cut, as the server sent them.
      });

    return () => {
      current = false;
    };
  }, [articleId, user?.id, subscriptions?.length, viewArticle]);

  return {
    access,
    prompts: prompts && prompts.articleId === articleId ? prompts.prompts : [],
  };
}
