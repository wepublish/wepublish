import { Link } from '@mui/material';
import { Trans } from 'react-i18next';

export const settingsHint = (i18nKey: string, href?: string) => (
  <Trans
    i18nKey={i18nKey}
    components={
      href === undefined ? undefined : (
        {
          url: (
            <Link
              href={href}
              target="_blank"
              rel="noreferrer"
            />
          ),
        }
      )
    }
  />
);
