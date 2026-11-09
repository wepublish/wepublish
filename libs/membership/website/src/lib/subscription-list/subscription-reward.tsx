import styled from '@emotion/styled';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';

const isURL = (string: string) => {
  try {
    new URL(string);

    return true;
  } catch {
    return false;
  }
};

export const SubscriptionListItemReward = styled('div')``;

/** A subscription's external reward: a link where it is a URL, else its text. */
export function SubscriptionReward({
  externalReward,
}: {
  externalReward?: string | null;
}) {
  const {
    elements: { Alert, Link },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  if (!externalReward) {
    return null;
  }

  return (
    <SubscriptionListItemReward>
      <Alert severity="info">
        {isURL(externalReward) ?
          <Link
            href={externalReward}
            target="_blank"
          >
            {t('subscription.externalReward', {
              isLink: true,
              externalReward,
            })}
          </Link>
        : t('subscription.externalReward', {
            isLink: false,
            externalReward,
          })
        }
      </Alert>
    </SubscriptionListItemReward>
  );
}
