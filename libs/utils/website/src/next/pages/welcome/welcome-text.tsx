import { Trans } from 'react-i18next';

/** A welcome text; a `<br>` in the translation becomes a line break. */
export const WelcomeText = ({ i18nKey }: { i18nKey: string }) => (
  <Trans
    i18nKey={i18nKey}
    components={{ br: <br /> }}
  />
);
