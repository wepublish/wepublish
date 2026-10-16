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
import {
  DeleteUserConsentDocument,
  UserConsentsDocument,
} from '@wepublish/editor/api';
import { IconButton, Button } from '@mui/material';

import { DeleteConsentDialog } from './delete-consent-dialog';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

export function UserConsentList() {
  const { t } = useTranslation();
  const { loading, data, refetch } = useQuery(UserConsentsDocument);

  const [deleteUserConsent] = useMutation(DeleteUserConsentDocument, {
    onError: onErrorToast,
    onCompleted: () => {
      enqueueSnackbar(t('toast.deletedSuccess'), {
        variant: 'success',
        autoHideDuration: 3000,
      });
      refetch();
    },
  });

  const [userConsentToDelete, setUserConsentToDelete] = useState<{
    id: string;
    name: string;
    user: string;
  }>();

  const onDeleteUserConsent = () => {
    if (!userConsentToDelete) {
      return;
    }

    deleteUserConsent({ variables: { id: userConsentToDelete.id } });
    setUserConsentToDelete(undefined);
  };

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('userConsents.title')}</PageTitle>
        </ListViewHeader>
        <ListViewActions>
          <Button
            component={RouterLink}
            to="/userConsents/create"
            variant="contained"
            startIcon={<MdAdd />}
            disabled={loading}
          >
            {t('userConsents.create')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="user-consents"
          data={data?.userConsents || []}
          loading={loading}
          columns={[
            {
              id: 'user',
              alwaysVisible: true,
              label: t('userConsents.user'),
              width: 200,
              render: rowData => (
                <Link to={`/userConsents/edit/${rowData.id}`}>
                  {(rowData.user.firstName || '') + ' ' + rowData.user.name}
                </Link>
              ),
            },
            {
              id: 'consentname',
              label: t('userConsents.consentName'),
              width: 200,
              alwaysVisible: true,
              render: rowData => <span>{rowData.consent.name}</span>,
            },
            {
              id: 'consentslug',
              label: t('userConsents.consentSlug'),
              width: 200,
              render: rowData => <span>{rowData.consent.slug}</span>,
            },
            {
              id: 'value',
              label: t('userConsents.value'),
              width: 200,
              render: rowData => (
                <span>
                  {rowData.value ?
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
                      setUserConsentToDelete({
                        id: rowData.id,
                        name: rowData.consent.name,
                        user: rowData.user.name,
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
        open={Boolean(userConsentToDelete)}
        title={t('userConsents.deleteTitle')}
        onClose={() => setUserConsentToDelete(undefined)}
        onConfirm={onDeleteUserConsent}
      >
        {t('userConsents.deleteBody', {
          name: userConsentToDelete?.name,
          user: userConsentToDelete?.user,
        })}
      </DeleteConsentDialog>
    </>
  );
}

export default UserConsentList;
