import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  enqueueSnackbar,
  humanizeError,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  TableWrapper,
  PageTitle,
} from '@wepublish/ui/editor';
import { ConsentsDocument, DeleteConsentDocument } from '@wepublish/editor/api';
import { IconButton, Button } from '@mui/material';

import { DeleteConsentDialog } from './delete-consent-dialog';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

export function ConsentList() {
  const { loading, data, refetch } = useQuery(ConsentsDocument);

  const [deleteConsent] = useMutation(DeleteConsentDocument, {
    onError: onErrorToast,
    onCompleted: () => {
      enqueueSnackbar(t('toast.deletedSuccess'), {
        variant: 'success',
        autoHideDuration: 3000,
      });
      refetch();
    },
  });

  const { t } = useTranslation();

  const [consentToDelete, setConsentToDelete] = useState<{
    id: string;
    name: string;
  }>();

  const onDeleteConsent = () => {
    if (!consentToDelete) {
      return;
    }

    deleteConsent({ variables: { id: consentToDelete.id } });
    setConsentToDelete(undefined);
  };

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('consents.title')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <Button
            component={RouterLink}
            to="/consents/create"
            variant="contained"
            startIcon={<MdAdd />}
          >
            {t('consents.create')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="consents"
          data={data?.consents || []}
          loading={loading}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
              label: t('consents.name'),
              width: 200,
              render: rowData => (
                <Link to={`/consents/edit/${rowData.id}`}>{rowData.name}</Link>
              ),
            },
            {
              id: 'slug',
              label: t('consents.slug'),
              width: 200,
              render: rowData => <span>{rowData.slug}</span>,
            },
            {
              id: 'defaultvalue',
              label: t('consents.defaultValue'),
              width: 200,
              render: rowData => (
                <span>
                  {rowData.defaultValue ?
                    t('consents.accepted')
                  : t('consents.rejected')}
                </span>
              ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: rowData => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    aria-label={t('delete')}
                    color="error"
                    size="small"
                    onClick={() =>
                      setConsentToDelete({
                        id: rowData.id,
                        name: rowData.name,
                      })
                    }
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              ),
            },
          ]}
        />
      </TableWrapper>

      <DeleteConsentDialog
        open={Boolean(consentToDelete)}
        title={t('consents.deleteTitle')}
        onClose={() => setConsentToDelete(undefined)}
        onConfirm={onDeleteConsent}
      >
        {t('consents.deleteBody', { name: consentToDelete?.name })}
      </DeleteConsentDialog>
    </>
  );
}

export default ConsentList;
