import { Alert, AlertTitle, Button, Stack } from '@mui/material';
import * as Sentry from '@sentry/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <Stack
          spacing={2}
          sx={{ p: 3 }}
        >
          <Alert severity="error">
            <AlertTitle>{t('errorBoundary.title')}</AlertTitle>
            {error instanceof Error ? error.message : String(error)}
          </Alert>

          <Stack
            direction="row"
            spacing={1}
          >
            <Button
              variant="contained"
              onClick={resetError}
            >
              {t('errorBoundary.retry')}
            </Button>

            <Button
              variant="text"
              onClick={() => window.location.reload()}
            >
              {t('errorBoundary.reload')}
            </Button>
          </Stack>
        </Stack>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
