import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  useDeleteLetterTemplateMutation,
  useLetterTemplateQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdEdit, MdMarkunreadMailbox } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, Modal, Stack, Tag } from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';
import { mailTypeLabel } from '../mail-template/mail-placeholders';

function LetterTemplateList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data } = useLetterTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const [deleteLetterTemplate] = useDeleteLetterTemplateMutation({
    ...DEFAULT_MUTATION_OPTIONS(t),
    refetchQueries: ['LetterTemplate'],
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteId) {
      return;
    }

    try {
      await deleteLetterTemplate({ variables: { id: deleteId } });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <Stack justifyContent={'space-between'}>
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('letterTemplates.title')}</h2>
          </ListViewHeader>
        </ListViewContainer>

        <PermissionControl
          qualifyingPermissions={['CAN_CREATE_MAIL_TEMPLATES']}
        >
          <Button
            appearance="primary"
            startIcon={<MdAdd />}
            onClick={() => navigate('/lettertemplates/create')}
          >
            {t('letterTemplates.create')}
          </Button>
        </PermissionControl>
      </Stack>

      <p style={{ margin: '8px 0 16px', maxWidth: '70ch' }}>
        {t('letterTemplates.providerHint', {
          provider: data?.letterProvider?.name ?? '',
        })}
      </p>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('letterTemplates.name')}</TableCell>
              <TableCell>{t('letterTemplates.purpose')}</TableCell>
              <TableCell>{t('letterTemplates.qrBill')}</TableCell>
              <TableCell align="right">
                {t('letterTemplates.actions')}
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data?.letterTemplates.map(letterTemplate => (
              <TableRow key={letterTemplate.id}>
                <TableCell>
                  <strong>{letterTemplate.name}</strong>
                  {letterTemplate.description && (
                    <div style={{ color: '#8e8e93', fontSize: '0.9em' }}>
                      {letterTemplate.description}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  {letterTemplate.context ?
                    mailTypeLabel(letterTemplate.context, (k, f) => t(k, f))
                  : <Tag color="orange">{t('letterTemplates.noPurpose')}</Tag>}
                </TableCell>

                <TableCell>
                  {letterTemplate.qrBill === 'LAST_PAGE' ?
                    <Tag color="green">
                      <MdMarkunreadMailbox style={{ marginRight: 4 }} />
                      {t('letterTemplates.qrBillOn')}
                    </Tag>
                  : <span style={{ color: '#8e8e93' }}>
                      {t('letterTemplates.qrBillOff')}
                    </span>
                  }
                </TableCell>

                <TableCell align="right">
                  <PermissionControl
                    qualifyingPermissions={['CAN_UPDATE_MAIL_TEMPLATES']}
                  >
                    <IconButton
                      icon={<MdEdit />}
                      size="sm"
                      onClick={() =>
                        navigate(`/lettertemplates/edit/${letterTemplate.id}`)
                      }
                    />
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={['CAN_DELETE_MAIL_TEMPLATES']}
                  >
                    <IconButton
                      icon={<MdDelete />}
                      size="sm"
                      color="red"
                      appearance="ghost"
                      style={{ marginLeft: 8 }}
                      onClick={() => setDeleteId(letterTemplate.id)}
                    />
                  </PermissionControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
      >
        <Modal.Header>
          <Modal.Title>{t('letterTemplates.deleteTitle')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>{t('letterTemplates.deleteBody')}</Modal.Body>

        <Modal.Footer>
          <Button
            appearance="primary"
            color="red"
            onClick={confirmDelete}
          >
            {t('letterTemplates.delete')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setDeleteId(null)}
          >
            {t('letterTemplates.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL_TEMPLATES',
])(LetterTemplateList);

export { CheckedPermissionComponent as LetterTemplateList };
