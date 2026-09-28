import { useMutation } from '@apollo/client';
import { Button } from '@mui/material';
import { DocumentNode } from 'graphql';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Form, Input, Message, Modal, SelectPicker, toaster } from 'rsuite';

export type ProviderTypeOption = {
  label: string;
  value: string;
};

/**
 * Removing a provider is a soft delete: the row stays and the provider keeps
 * being instantiated, so payments already under way still resolve. Only the
 * lists forget about it.
 */
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
      toaster.push(<Message type="error">{(error as Error).message}</Message>, {
        duration: 8000,
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>{t('integrations.deleteTitle')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>{t('integrations.deleteWarning')}</Modal.Body>

        <Modal.Footer>
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
        </Modal.Footer>
      </Modal>
    </>
  );
}

/**
 * Adding a provider whose id was removed before brings the old row back with
 * its configuration untouched, which is worth saying out loud.
 */
export function AddIntegrationButton({
  types,
  mutation,
  refetchQuery,
  existingIds,
}: {
  types: ProviderTypeOption[];
  mutation: DocumentNode;
  refetchQuery: DocumentNode;
  existingIds: string[];
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

      // A row that predates this call is one that was deleted and is now back.
      const created = Object.values(data ?? {})[0] as
        | { createdAt?: string }
        | undefined;
      const restored =
        !!created?.createdAt &&
        Date.now() - new Date(created.createdAt).getTime() > 60_000;

      if (restored) {
        toaster.push(
          <Message type="info">{t('integrations.restored')}</Message>,
          { duration: 8000 }
        );
      }

      close();
    } catch (error) {
      toaster.push(<Message type="error">{(error as Error).message}</Message>, {
        duration: 8000,
      });
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<MdAdd />}
        onClick={() => setOpen(true)}
      >
        {t('integrations.add')}
      </Button>

      <Modal
        open={open}
        onClose={close}
      >
        <Modal.Header>
          <Modal.Title>{t('integrations.add')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
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
              <Message type="warning">{t('integrations.addIdTaken')}</Message>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer>
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
            {t('integrations.add')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

/**
 * Some integrations are looked up by an id that is fixed in the API — the AI
 * provider under `v0`, analytics under `google-analytics`. There is nothing to
 * choose when creating one, and an id of the operator's choosing would simply
 * never be read, so this creates that one row and nothing else.
 */
export function CreateFixedIntegrationButton({
  id,
  type,
  name,
  mutation,
  refetchQuery,
}: {
  id: string;
  type: string;
  name: string;
  mutation: DocumentNode;
  refetchQuery: DocumentNode;
}) {
  const { t } = useTranslation();
  const [create, { loading }] = useMutation(mutation, {
    refetchQueries: [{ query: refetchQuery }],
  });

  const onClick = async () => {
    try {
      await create({ variables: { id, type, name } });
    } catch (error) {
      toaster.push(<Message type="error">{(error as Error).message}</Message>, {
        duration: 8000,
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
      {t('integrations.add')}
    </Button>
  );
}
