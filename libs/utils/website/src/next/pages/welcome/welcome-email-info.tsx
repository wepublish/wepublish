import { Trans } from 'react-i18next';

/** A welcome text naming an address; `<bold>` in the translation marks it. */
export const WelcomeEmailInfo = ({
  email,
  i18nKey = 'welcome.emailVerifyInfo',
}: {
  email: string;
  i18nKey?: 'welcome.emailVerifyInfo' | 'welcome.emailSent';
}) => (
  <Trans
    i18nKey={i18nKey}
    values={{ email }}
    components={{ bold: <strong /> }}
  />
);
