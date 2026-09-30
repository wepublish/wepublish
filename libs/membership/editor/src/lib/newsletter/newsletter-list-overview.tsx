import {
  FullNewsletterListFragment,
  useDeleteNewsletterListMutation,
  useNewsletterListsQuery,
} from '@wepublish/editor/api';
import {
  CanCreateNewsletterList,
  CanDeleteNewsletterList,
  CanGetNewsletterLists,
  CanUpdateNewsletterList,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  IconButton,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  PermissionControl,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  IconButton as RIconButton,
  Modal,
  Table as RTable,
} from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

const { Column, HeaderCell, Cell: RCell } = RTable;

function NewsletterListOverview() {
  const { t } = useTranslation();
  const [listToDelete, setListToDelete] =
    useState<FullNewsletterListFragment>();

  const { data, loading, refetch } = useNewsletterListsQuery();
  const [deleteNewsletterList] = useDeleteNewsletterListMutation({
    onCompleted() {
      refetch();
    },
  });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('newsletter.overview.title')}</h2>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[CanCreateNewsletterList.id]}>
          <ListViewActions>
            <Link to="create">
              <RIconButton appearance="primary">
                <MdAdd />
                {t('newsletter.overview.create')}
              </RIconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <Table
          autoHeight
          loading={loading}
          data={data?.newsletterLists ?? []}
        >
          <Column
            width={75}
            resizable
          >
            <HeaderCell>{t('newsletter.overview.active')}</HeaderCell>
            <RCell>
              {(list: FullNewsletterListFragment) =>
                list.active ? '✅' : '❌'
              }
            </RCell>
          </Column>

          <Column
            width={250}
            resizable
          >
            <HeaderCell>{t('newsletter.overview.name')}</HeaderCell>
            <RCell>
              {(list: FullNewsletterListFragment) => (
                <Link to={`edit/${list.id}`}>{list.name}</Link>
              )}
            </RCell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('newsletter.overview.slug')}</HeaderCell>
            <RCell dataKey="slug" />
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('newsletter.overview.access')}</HeaderCell>
            <RCell>
              {(list: FullNewsletterListFragment) =>
                list.requiresSubscription ?
                  t('newsletter.overview.subscribersOnly')
                : t('newsletter.overview.everyone')
              }
            </RCell>
          </Column>

          <Column
            width={150}
            resizable
          >
            <HeaderCell>{t('newsletter.overview.autoSubscribe')}</HeaderCell>
            <RCell>
              {(list: FullNewsletterListFragment) => {
                if (!list.requiresSubscription) {
                  return '–';
                }

                return list.autoSubscribe ? '✅' : '❌';
              }}
            </RCell>
          </Column>

          <Column
            fixed="right"
            width={60}
          >
            <HeaderCell align="center">{t('delete')}</HeaderCell>
            <PaddedCell align="center">
              {(list: RowDataType<FullNewsletterListFragment>) => (
                <PermissionControl
                  qualifyingPermissions={[CanDeleteNewsletterList.id]}
                >
                  <IconButton
                    icon={<MdDelete />}
                    circle
                    appearance="ghost"
                    color="red"
                    size="sm"
                    aria-label={t('delete')}
                    onClick={() =>
                      setListToDelete(list as FullNewsletterListFragment)
                    }
                  />
                </PermissionControl>
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <Modal
        open={!!listToDelete}
        backdrop="static"
        size="xs"
        onClose={() => setListToDelete(undefined)}
      >
        <Modal.Title>{t('newsletter.overview.deleteTitle')}</Modal.Title>

        <Modal.Body>
          {listToDelete &&
            t('newsletter.overview.deleteBody', { list: listToDelete.name })}
        </Modal.Body>

        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
            onClick={() => {
              if (listToDelete) {
                deleteNewsletterList({ variables: { id: listToDelete.id } });
              }

              setListToDelete(undefined);
            }}
          >
            {t('newsletter.overview.deleteConfirm')}
          </Button>

          <Button
            appearance="subtle"
            onClick={() => setListToDelete(undefined)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetNewsletterLists.id,
  CanCreateNewsletterList.id,
  CanUpdateNewsletterList.id,
  CanDeleteNewsletterList.id,
])(NewsletterListOverview);

export { CheckedPermissionComponent as NewsletterListOverview };
