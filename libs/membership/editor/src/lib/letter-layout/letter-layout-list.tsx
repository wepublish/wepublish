import { useMutation, useQuery } from '@apollo/client/react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  DeleteLetterLayoutDocument,
  LetterLayoutsDocument,
  TinyLetterLayoutFragment,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  IconButtonTooltip,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { Button, IconButton, Modal, Stack, Tag } from 'rsuite';
import { MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE, showErrors } from '../common';

function LetterLayoutList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<TinyLetterLayoutFragment | null>(
    null
  );

  const { data, error } = useQuery(LetterLayoutsDocument);

  useEffect(() => {
    if (error) {
      showErrors(error);
    }
  }, [error]);

  const [deleteLayout] = useMutation(DeleteLetterLayoutDocument, {
    ...MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(t('toast.deletedSuccess')),
    refetchQueries: ['LetterLayouts'],
  });

  const layouts = data?.letterLayouts ?? [];

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('letterLayouts.title')}</h2>
          <p style={{ color: 'var(--rs-text-secondary)', maxWidth: 720 }}>
            {t('letterLayouts.intro')}
          </p>
        </ListViewHeader>
        <PermissionControl
          qualifyingPermissions={['CAN_CREATE_MAIL-TEMPLATES']}
        >
          <Link to="/letterlayouts/create">
            <IconButton
              appearance="primary"
              icon={<MdAdd />}
            >
              {t('letterLayouts.create')}
            </IconButton>
          </Link>
        </PermissionControl>
      </ListViewContainer>

      <TableContainer style={{ marginTop: 20 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('letterLayouts.name')}</TableCell>
              <TableCell align="right">{t('action')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {layouts.map(layout => (
              <TableRow key={layout.id}>
                <TableCell>
                  <Stack
                    spacing={8}
                    alignItems="center"
                  >
                    <Link to={`/letterlayouts/edit/${layout.id}`}>
                      {layout.name}
                    </Link>
                    {layout.isDefault && (
                      <Tag color="blue">{t('letterLayouts.default')}</Tag>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack
                    spacing={4}
                    justifyContent="flex-end"
                  >
                    <IconButtonTooltip caption={t('edit')}>
                      <IconButton
                        aria-label={t('edit')}
                        icon={<MdEdit />}
                        circle
                        size="sm"
                        onClick={() =>
                          navigate(`/letterlayouts/edit/${layout.id}`)
                        }
                      />
                    </IconButtonTooltip>
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        aria-label={t('delete')}
                        icon={<MdDelete />}
                        color="red"
                        appearance="ghost"
                        circle
                        size="sm"
                        onClick={() => setToDelete(layout)}
                      />
                    </IconButtonTooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!layouts.length && (
              <TableRow>
                <TableCell colSpan={2}>
                  {t('letterLayouts.noLayouts')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        size="sm"
      >
        <Modal.Header>
          <Modal.Title>{t('letterLayouts.deleteTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('letterLayouts.deleteQuestion', { name: toDelete?.name })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            color="red"
            onClick={() => {
              if (toDelete) {
                deleteLayout({ variables: { id: toDelete.id } });
              }
              setToDelete(null);
            }}
          >
            {t('letterLayouts.deleteConfirm')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setToDelete(null)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_UPDATE_MAIL-TEMPLATES',
])(LetterLayoutList);
export { CheckedPermissionComponent as LetterLayoutList };
