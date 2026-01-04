import { Alert } from '@mui/material';
import {
  BuilderApiAlertProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

enum ErrorMessage {
  EmailAlreadyInUse = 'Email already in use',
}

export function translateApolloErrorMessage(
  errorMessage: string
): string | undefined {
  switch (errorMessage) {
    case ErrorMessage.EmailAlreadyInUse:
      return 'Es besteht bereits ein Konto mit dieser E-mail.';
  }

  return errorMessage;
}

export function ApiAlert({ error, ...props }: BuilderApiAlertProps) {
  const {
    elements: { Link },
  } = useWebsiteBuilder();

  return (
    <Alert {...props}>
      {translateApolloErrorMessage(error.message)}

      {error.message === ErrorMessage.EmailAlreadyInUse && (
        <>
          {' '}
          <Link href={'/login'}>{'Bitte einloggen'}</Link>
        </>
      )}
    </Alert>
  );
}
