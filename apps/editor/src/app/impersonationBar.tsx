import { useMutation, useQuery } from '@apollo/client/react';
import { Alert, Button } from '@mui/material';
import {
  CurrentSessionDocument,
  EndImpersonationDocument,
} from '@wepublish/editor/api';
import { AuthContext } from '@wepublish/ui/editor';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { endEditorImpersonation } from './impersonation';

export function ImpersonationBar() {
  const { t } = useTranslation();
  const { session } = useContext(AuthContext);
  const { data } = useQuery(CurrentSessionDocument);
  const [endImpersonation] = useMutation(EndImpersonationDocument);
  const [ending, setEnding] = useState(false);

  const supporter = data?.currentSession.impersonatedBy;

  if (!supporter) {
    return null;
  }

  const end = async () => {
    setEnding(true);
    await endImpersonation().catch(() => undefined);
    endEditorImpersonation();
  };

  return (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Button
          color="inherit"
          size="small"
          disabled={ending}
          onClick={end}
        >
          {t('impersonation.end')}
        </Button>
      }
    >
      {t('impersonation.active', {
        email: session?.email ?? '',
        supporter,
      })}
    </Alert>
  );
}
