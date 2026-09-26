import {
  NewsletterSummaryFragment,
  useNewslettersQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  IconButton,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { IconButton as RIconButton, Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';
import { NewsletterCreateModal } from './newsletter-create-modal';
import { NewsletterDeleteModal } from './newsletter-delete-modal';

const { Column, HeaderCell, Cell: RCell } = RTable;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('de-CH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

function NewsletterListPage() {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<
    NewsletterSummaryFragment | undefined
  >();

  const { data, loading, refetch } = useNewslettersQuery({
    variables: { take: 100, skip: 0 },
    fetchPolicy: 'network-only',
  });

  const newsletters = data?.newsletters.nodes ?? [];

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('newsletter.list.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <RIconButton
            appearance="primary"
            icon={<MdAdd />}
            loading={loading}
            onClick={() => setCreating(true)}
          >
            {t('newsletter.list.createNew')}
          </RIconButton>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={newsletters}
        >
          <Column
            width={360}
            resizable
          >
            <HeaderCell>{t('newsletter.list.name')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<NewsletterSummaryFragment>) => (
                <Link to={`/newsletters/edit/${rowData['id']}`}>
                  {rowData['title']}
                </Link>
              )}
            </RCell>
          </Column>
          <Column
            width={100}
            resizable
          >
            <HeaderCell>{t('newsletter.list.blocks')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<NewsletterSummaryFragment>) =>
                rowData['blockCount']
              }
            </RCell>
          </Column>
          <Column
            width={180}
            resizable
          >
            <HeaderCell>{t('newsletter.list.modifiedAt')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<NewsletterSummaryFragment>) =>
                formatDate(rowData['modifiedAt'])
              }
            </RCell>
          </Column>
          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('newsletter.list.mailchimp')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<NewsletterSummaryFragment>) => {
                const summary = rowData as NewsletterSummaryFragment;

                if (summary.mailchimpEditUrl) {
                  return (
                    <a
                      href={summary.mailchimpEditUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('newsletter.list.openDraft')}
                    </a>
                  );
                }

                return summary.mailchimpCampaignId ?
                    t('newsletter.list.draftExists')
                  : t('newsletter.list.notPublished');
              }}
            </RCell>
          </Column>
          <Column
            resizable
            fixed="right"
          >
            <HeaderCell align="center">
              {t('newsletter.list.delete')}
            </HeaderCell>
            <PaddedCell align="center">
              {(rowData: RowDataType<NewsletterSummaryFragment>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() =>
                    setDeleting(rowData as NewsletterSummaryFragment)
                  }
                />
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <NewsletterCreateModal
        open={creating}
        latest={newsletters[0]}
        onClose={() => setCreating(false)}
      />
      <NewsletterDeleteModal
        newsletter={deleting}
        onDelete={refetch}
        onClose={() => setDeleting(undefined)}
      />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NEWSLETTERS',
  'CAN_GET_NEWSLETTER',
  'CAN_CREATE_NEWSLETTER',
  'CAN_DELETE_NEWSLETTER',
])(NewsletterListPage);
export { CheckedPermissionComponent as NewsletterList };
