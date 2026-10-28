import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { pageTitleKey } from './pageTitles';

const PRODUCT_NAME = 'We.Publish';

export function DocumentTitle() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const key = pageTitleKey(pathname);
  const title = key ? `${t(key)} · ${PRODUCT_NAME}` : PRODUCT_NAME;

  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}
