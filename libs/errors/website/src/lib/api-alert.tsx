import { Alert, NoSsr } from '@mui/material';
import { ErrorCode } from '@wepublish/errors';
import {
  BuilderApiAlertProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

enum ErrorMessage {
  EmailAlreadyInUse = 'Email already in use',
}

export function translateApolloErrorMessage(
  errorMessage: string,
  t: TFunction
): string | undefined {
  switch (errorMessage) {
    case ErrorMessage.EmailAlreadyInUse:
      return t('errors.emailAlreadyInUse');
    case ErrorCode.PaymentAlreadyRunning:
      return t('errors.paymentAlreadyRunning');
    case ErrorCode.LinkExpired:
      return t('errors.linkExpired');
    case ErrorCode.PaymentIntentNotFound:
      return t('errors.paymentIntentNotFound');
  }

  return errorMessage;
}

export function ApiAlert({ error, ...props }: BuilderApiAlertProps) {
  const {
    elements: { Link },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  const loginLink =
    typeof window !== 'undefined' ?
      `/login?intended=${window.location.pathname}${window.location.search}`
    : `/login`;

  return (
    <NoSsr>
      <Alert {...props}>
        {translateApolloErrorMessage(error.message, t)}

        {error.message === ErrorMessage.EmailAlreadyInUse && (
          <>
            {' '}
            <Link href={loginLink}>{t('errors.pleaseLogin')}</Link>
          </>
        )}
      </Alert>
    </NoSsr>
  );
}
