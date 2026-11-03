import styled from '@emotion/styled';
import { Alert, Button, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

export const PuckEditorStatusWrapper = styled.main`
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing(2)};
`;

export function PuckEditorLoading() {
  const { t } = useTranslation();

  return (
    <PuckEditorStatusWrapper>
      <CircularProgress aria-label={t('loading')} />
    </PuckEditorStatusWrapper>
  );
}

export function PuckEditorError({
  message,
  backTo,
  backLabel,
}: {
  message: string;
  backTo: string;
  backLabel: string;
}) {
  return (
    <PuckEditorStatusWrapper>
      <Alert
        severity="error"
        action={
          <Button
            component={RouterLink}
            to={backTo}
            color="inherit"
            size="small"
          >
            {backLabel}
          </Button>
        }
      >
        {message}
      </Alert>
    </PuckEditorStatusWrapper>
  );
}
