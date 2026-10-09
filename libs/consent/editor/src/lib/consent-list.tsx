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
import { ConsentsDocument, DeleteConsentDocument } from '@wepublish/editor/api';
import { IconButton, Button } from '@mui/material';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

/* eslint-disable-next-line */
export interface ConsentListProps {}

export function ConsentList(props: ConsentListProps) {
  const { loading, data, refetch, error } = useQuery(ConsentsDocument);

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

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

  const onDeleteConsent = (id: string) => {
    deleteConsent({
      variables: {
        id,
      },
    });
  };

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('consents.title')}</h2>
        </ListViewHeader>
        <ListViewActions>
          <Link to="/consents/create">
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              disabled={loading}
            >
              {t('consents.create')}
            </Button>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          data={data?.consents || []}
          loading={loading}
          columns={[
            {
              id: 'name',
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
                    onClick={() => onDeleteConsent(rowData.id)}
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

export default ConsentList;
