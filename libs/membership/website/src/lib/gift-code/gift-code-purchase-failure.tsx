import {
  BuilderRouterContext,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

export function GiftCodePurchaseFailure({ className }: { className?: string }) {
  const {
    elements: { Alert },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { query } = useContext(BuilderRouterContext);

  if (query.giftCodePurchase !== 'failure') {
    return null;
  }

  return (
    <Alert
      severity="error"
      className={className}
    >
      {t('giftCode.purchase.failure')}
    </Alert>
  );
}
