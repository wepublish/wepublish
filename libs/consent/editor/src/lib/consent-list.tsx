import { ApolloError } from '@apollo/client';
import { IconButton, Message, Table as RTable, toaster } from 'rsuite';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import {
  Consent,
  useConsentsQuery,
  useDeleteConsentMutation,
} from '@wepublish/editor/api';
import { RowDataType } from 'rsuite-table';

const consentValues = [
  {
    value: true,
    label: 'Accepted',
  },
  {
    value: false,
    label: 'Rejected',
  },
];

const { Column, HeaderCell, Cell } = RTable;

const onErrorToast = (error: ApolloError) => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={3000}
    >
      {error.message}
    </Message>
  );
};

/* eslint-disable-next-line */
export interface ConsentListProps {}

export function ConsentList(props: ConsentListProps) {
  const { loading, data, refetch } = useConsentsQuery({
    onError: onErrorToast,
  });

  const [deleteConsent] = useDeleteConsentMutation({
    onError: onErrorToast,
    onCompleted: () => {
      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('toast.deletedSuccess')}
        </Message>
      );
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
            <IconButton
              appearance="primary"
              disabled={loading}
              icon={<MdAdd />}
            >
              {t('consents.create')}
            </IconButton>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.consents || []}
        >
          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('consents.name')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Consent>) => (
                <Link to={`/consents/edit/${rowData.id}`}>{rowData.name}</Link>
              )}
            </Cell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('consents.slug')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Consent>) => <span>{rowData.slug}</span>}
            </Cell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('consents.defaultValue')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<Consent>) => (
                <span>
                  {
                    consentValues.find(v => v.value === rowData.defaultValue)
                      ?.label
                  }
                </span>
              )}
            </Cell>
          </Column>

          <Column resizable>
            <HeaderCell align={'center'}>{t('delete')}</HeaderCell>
            <Cell
              align={'center'}
              style={{ padding: '5px 0' }}
            >
              {(rowData: RowDataType<Consent>) => (
                <IconButton
                  icon={<MdDelete />}
                  color="red"
                  appearance="ghost"
                  circle
                  size="sm"
                  onClick={() => onDeleteConsent(rowData.id)}
                />
              )}
            </Cell>
          </Column>
        </Table>
      </TableWrapper>
    </>
  );
}

export default ConsentList;
