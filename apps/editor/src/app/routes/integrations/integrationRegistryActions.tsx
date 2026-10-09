import { useMutation } from '@apollo/client/react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { DocumentNode } from 'graphql';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Form, Input, SelectPicker } from 'rsuite';

export type ProviderTypeOption = {
  label: string;
  value: string;
};

export function DeleteIntegrationButton({
  id,
  mutation,
  refetchQuery,
}: {
  id: string;
  mutation: DocumentNode;
  refetchQuery: DocumentNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [remove, { loading }] = useMutation(mutation, {
    refetchQueries: [{ query: refetchQuery }],
  });

  const onConfirm = async () => {
    try {
      await remove({ variables: { id } });
      setOpen(false);
    } catch (error) {
      enqueueSnackbar((error as Error).message, {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }
  };

  return (
    <>
      <Button
        variant="text"
        color="error"
        startIcon={<MdDelete />}
        onClick={() => setOpen(true)}
      >
        {t('integrations.deleteConfirm')}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>{t('integrations.deleteTitle')}</DialogTitle>

        <DialogContent>{t('integrations.deleteWarning')}</DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setOpen(false)}
          >
            {t('integrations.cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={loading}
            onClick={onConfirm}
          >
            {t('integrations.deleteConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function AddIntegrationButton({
  types,
  mutation,
  refetchQuery,
  existingIds,
  label,
}: {
  types: ProviderTypeOption[];
  mutation: DocumentNode;
  refetchQuery: DocumentNode;
  existingIds: string[];
  label?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [create, { loading }] = useMutation(mutation, {
    refetchQueries: [{ query: refetchQuery }],
  });

  const close = () => {
    setOpen(false);
    setId('');
    setType(null);
  };

  const onConfirm = async () => {
    if (!id || !type) {
      return;
    }

    try {
      const { data } = await create({ variables: { id, type, name: id } });

      const created = Object.values(data ?? {})[0] as
        | { createdAt?: string }
        | undefined;
      const restored =
        !!created?.createdAt &&
        Date.now() - new Date(created.createdAt).getTime() > 60_000;

      if (restored) {
        enqueueSnackbar(t('integrations.restored'), { autoHideDuration: 8000 });
      }

      close();
    } catch (error) {
      enqueueSnackbar((error as Error).message, {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }
  };

  return (
    <>
      <Button
        variant={label ? 'contained' : 'outlined'}
        startIcon={<MdAdd />}
        onClick={() => setOpen(true)}
      >
        {label ?? t('integrations.add')}
      </Button>

      <Dialog
        open={open}
        onClose={close}
      >
        <DialogTitle>{label ?? t('integrations.add')}</DialogTitle>

        <DialogContent>
          <Form fluid>
            <Form.Group>
              <Form.ControlLabel>{t('integrations.addType')}</Form.ControlLabel>

              <SelectPicker
                block
                cleanable={false}
                data={types}
                value={type}
                onChange={value => {
                  setType(value);

                  if (!id && value) {
                    setId(value);
                  }
                }}
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>{t('integrations.addId')}</Form.ControlLabel>

              <Input
                value={id}
                onChange={setId}
              />

              <Form.HelpText>{t('integrations.addIdHelp')}</Form.HelpText>
            </Form.Group>

            {existingIds.includes(id) && (
              <Alert severity="warning">{t('integrations.addIdTaken')}</Alert>
            )}
          </Form>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={close}
          >
            {t('integrations.cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={loading || !id || !type || existingIds.includes(id)}
            onClick={onConfirm}
          >
            {label ?? t('integrations.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function CreateFixedIntegrationButton({
  id,
  type,
  name,
  mutation,
  refetchQuery,
  label,
}: {
  id: string;
  type: string;
  name: string;
  mutation: DocumentNode;
  refetchQuery: DocumentNode;
  label?: string;
}) {
  const { t } = useTranslation();
  const [create, { loading }] = useMutation(mutation, {
    refetchQueries: [{ query: refetchQuery }],
  });

  const onClick = async () => {
    try {
      await create({ variables: { id, type, name } });
    } catch (error) {
      enqueueSnackbar((error as Error).message, {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }
  };

  return (
    <Button
      variant="contained"
      startIcon={<MdAdd />}
      disabled={loading}
      onClick={onClick}
    >
      {label ?? t('integrations.add')}
    </Button>
  );
}
