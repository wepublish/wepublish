import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect } from 'react';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  humanizeError,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  TableWrapper,
  enqueueSnackbar,
  DataTable,
} from '@wepublish/ui/editor';
import {
  DeleteUserConsentDocument,
  UserConsentsDocument,
} from '@wepublish/editor/api';
import { IconButton, Button } from '@mui/material';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

/* eslint-disable-next-line */
export interface UserConsentListProps {}

export function UserConsentList(props: UserConsentListProps) {
  const { t } = useTranslation();

  const { loading, data, refetch, error } = useQuery(UserConsentsDocument);

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

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

  const onDeleteUserConsent = (id: string) => {
    deleteUserConsent({
      variables: {
        id,
      },
    });
  };

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('userConsents.title')}</h2>
        </ListViewHeader>
        <ListViewActions>
          <Link to="/userConsents/create">
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              disabled={loading}
            >
              {t('userConsents.create')}
            </Button>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          data={data?.userConsents || []}
          loading={loading}
          columns={[
            {
              id: 'user',
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
                    onClick={() => onDeleteUserConsent(rowData.id)}
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              ),
            },
          ]}
        />
      </TableWrapper>
    </>
  );
}

export default UserConsentList;
