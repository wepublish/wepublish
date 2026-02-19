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
  useUserConsentsQuery,
  useDeleteUserConsentMutation,
  UserConsent,
} from '@wepublish/editor/api';
import { RowDataType } from 'rsuite-table';

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
export interface UserConsentListProps {}

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

export function UserConsentList(props: UserConsentListProps) {
  const { t } = useTranslation();

  const { loading, data, refetch } = useUserConsentsQuery({
    onError: onErrorToast,
  });

  const [deleteUserConsent] = useDeleteUserConsentMutation({
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
            <IconButton
              appearance="primary"
              disabled={loading}
              icon={<MdAdd />}
            >
              {t('userConsents.create')}
            </IconButton>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.userConsents || []}
        >
          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('userConsents.user')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<UserConsent>) => (
                <Link to={`/userConsents/edit/${rowData.id}`}>
                  {(rowData.user.firstName || '') + ' ' + rowData.user.name}
                </Link>
              )}
            </Cell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('userConsents.consentName')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<UserConsent>) => (
                <span>{rowData.consent.name}</span>
              )}
            </Cell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('userConsents.consentSlug')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<UserConsent>) => (
                <span>{rowData.consent.slug}</span>
              )}
            </Cell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('userConsents.value')}</HeaderCell>
            <Cell>
              {(rowData: RowDataType<UserConsent>) => (
                <span>
                  {consentValues.find(v => v.value === rowData.value)?.label}
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
              {(rowData: RowDataType<UserConsent>) => (
                <IconButton
                  icon={<MdDelete />}
                  color="red"
                  appearance="ghost"
                  circle
                  size="sm"
                  onClick={() => onDeleteUserConsent(rowData.id)}
                />
              )}
            </Cell>
          </Column>
        </Table>
      </TableWrapper>
    </>
  );
}

export default UserConsentList;
