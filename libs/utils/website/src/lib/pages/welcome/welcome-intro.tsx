import { Trans } from 'react-i18next';

/** The welcome text; a `<br>` in the translation becomes a line break. */
export const WelcomeIntro = ({
  placeholderEmail,
}: {
  placeholderEmail: boolean;
}) => (
  <Trans
    i18nKey={placeholderEmail ? 'welcome.introPlaceholder' : 'welcome.intro'}
    components={{ br: <br /> }}
  />
);
