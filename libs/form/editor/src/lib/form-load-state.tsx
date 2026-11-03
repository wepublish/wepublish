import styled from '@emotion/styled';
import { Alert, AlertTitle, Button, CircularProgress } from '@mui/material';
import { humanizeError } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

const Centered = styled.div`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(4)};
`;

export function FormLoading() {
  const { t } = useTranslation();

  return (
    <Centered>
      <CircularProgress aria-label={t('form.loading')} />
    </Centered>
  );
}

export function FormLoadError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Alert
      severity="error"
      action={
        <Button
          color="inherit"
          size="small"
          onClick={retry}
        >
          {t('form.loadError.retry')}
        </Button>
      }
    >
      <AlertTitle>{t('form.loadError.title')}</AlertTitle>
      {humanizeError(error)}
    </Alert>
  );
}
