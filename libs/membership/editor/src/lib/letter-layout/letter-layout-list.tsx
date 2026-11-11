import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
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
          <Typography
            component="p"
            sx={{ color: 'text.secondary', maxWidth: 720 }}
          >
            {t('letterLayouts.intro')}
          </Typography>
        </ListViewHeader>
        <PermissionControl
          qualifyingPermissions={['CAN_CREATE_MAIL-TEMPLATES']}
        >
          <Link to="/letterlayouts/create">
            <Button
              variant="contained"
              startIcon={<MdAdd />}
            >
              {t('letterLayouts.create')}
            </Button>
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
                    direction="row"
                    sx={{ alignItems: 'center' }}
                    spacing={1}
                  >
                    <Link to={`/letterlayouts/edit/${layout.id}`}>
                      {layout.name}
                    </Link>
                    {layout.isDefault && (
                      <Chip
                        color="primary"
                        label={t('letterLayouts.default')}
                      />
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'flex-end' }}
                    spacing={0.5}
                  >
                    <IconButtonTooltip caption={t('edit')}>
                      <IconButton
                        aria-label={t('edit')}
                        size="small"
                        onClick={() =>
                          navigate(`/letterlayouts/edit/${layout.id}`)
                        }
                      >
                        <MdEdit />
                      </IconButton>
                    </IconButtonTooltip>
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        aria-label={t('delete')}
                        color="error"
                        size="small"
                        onClick={() => setToDelete(layout)}
                      >
                        <MdDelete />
                      </IconButton>
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

      <Dialog
        fullWidth
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        maxWidth="sm"
      >
        <DialogTitle>{t('letterLayouts.deleteTitle')}</DialogTitle>
        <DialogContent>
          {t('letterLayouts.deleteQuestion', { name: toDelete?.name })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
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
            variant="text"
            onClick={() => setToDelete(null)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_UPDATE_MAIL-TEMPLATES',
])(LetterLayoutList);
export { CheckedPermissionComponent as LetterLayoutList };
