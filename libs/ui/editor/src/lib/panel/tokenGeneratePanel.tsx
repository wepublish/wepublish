import { useMutation } from '@apollo/client/react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from '@mui/material';
import { CreateTokenDocument, TokenListDocument } from '@wepublish/editor/api';
import { CanCreateToken } from '@wepublish/permissions';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { createCheckedPermissionComponent } from '../atoms';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { humanizeError } from '../humanizeError';
import { enqueueSnackbar } from '../snackbar';
import { getOperationNameFromDocument } from '../utility';

export interface TokenGeneratePanelProps {
  onClose?(): void;
}

function TokenGeneratePanel({ onClose }: TokenGeneratePanelProps) {
  const [name, setName] = useState('');

  const [createToken, { data, loading: isCreating, error: createError }] =
    useMutation(CreateTokenDocument, {
      refetchQueries: [getOperationNameFromDocument(TokenListDocument)],
    });

  const isDisabled = isCreating;
  const token = data?.createToken.token;
  const hasGeneratedToken = token !== undefined;

  const { t } = useTranslation();

  useEffect(() => {
    if (createError?.message) {
      enqueueSnackbar(humanizeError(createError), {
        variant: 'error',
        autoHideDuration: null,
      });
    }
  }, [createError]);

  async function handleSave() {
    await createToken({ variables: { name } });
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('tokenList.panels.generateToken')}</DrawerTitle>

        <DrawerActions>
          {!hasGeneratedToken && (
            <Button
              variant="contained"
              disabled={isDisabled}
              onClick={handleSave}
            >
              {t('tokenList.panels.generate')}
            </Button>
          )}
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('tokenList.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>
      <DrawerBody>
        {token ?
          <>
            <Typography>{t('tokenList.panels.creationSuccess')}</Typography>
            <Card
              variant="outlined"
              data-sentry-mask
            >
              <CardContent>{token}</CardContent>
            </Card>
            <Alert severity="warning">
              {t('tokenList.panels.tokenWarning')}
            </Alert>
          </>
        : <TextField
            label={t('tokenList.panels.name')}
            value={name}
            disabled={isDisabled}
            onChange={event => {
              setName(event.target.value);
            }}
          />
        }
      </DrawerBody>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateToken.id,
])(TokenGeneratePanel);
export { CheckedPermissionComponent as TokenGeneratePanel };
