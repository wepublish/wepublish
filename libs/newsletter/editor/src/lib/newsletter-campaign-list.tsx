import { useMutation, useQuery } from '@apollo/client/react';
import {
  ArchiveNewsletterCampaignDocument,
  CreateNewsletterCampaignDocument,
  DuplicateNewsletterCampaignDocument,
  NewsletterCampaignsDocument,
  NewsletterCampaignStatus,
  NewsletterCampaignSummaryFragment,
  UnarchiveNewsletterCampaignDocument,
} from '@wepublish/editor/api';
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
import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdArchive,
  MdContentCopy,
  MdUnarchive,
  MdVisibility,
} from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import {
  Checkbox,
  IconButton as RIconButton,
  Input,
  Message,
  Table as RTable,
  Tag,
  toaster,
} from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

const { Column, HeaderCell, Cell: RCell } = RTable;

type Row = RowDataType<NewsletterCampaignSummaryFragment>;

const toastError = (error: Error) =>
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

function NewsletterCampaignList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  const { data, loading, error, refetch } = useQuery(
    NewsletterCampaignsDocument,
    { variables: { includeArchived } }
  );

  useEffect(() => {
    if (error) {
      toastError(error);
    }
  }, [error]);

  const [create, { loading: creating }] = useMutation(
    CreateNewsletterCampaignDocument,
    {
      onError: toastError,
      onCompleted: ({ createNewsletterCampaign }) =>
        navigate(`/newsletter/edit/${createNewsletterCampaign.id}`),
    }
  );

  const [duplicate, { loading: duplicating }] = useMutation(
    DuplicateNewsletterCampaignDocument,
    {
      onError: toastError,
      onCompleted: ({ duplicateNewsletterCampaign }) =>
        navigate(`/newsletter/edit/${duplicateNewsletterCampaign.id}`),
    }
  );

  const [archive, { loading: archiving }] = useMutation(
    ArchiveNewsletterCampaignDocument,
    { onError: toastError, onCompleted: () => refetch() }
  );

  const [unarchive, { loading: unarchiving }] = useMutation(
    UnarchiveNewsletterCampaignDocument,
    { onError: toastError, onCompleted: () => refetch() }
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (title.trim()) {
      create({ variables: { title } });
    }
  };

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('newsletter.list.title')}</h2>
        </ListViewHeader>

        <PermissionControl
          qualifyingPermissions={['CAN_CREATE_NEWSLETTER_CAMPAIGN']}
        >
          <ListViewActions>
            <form
              onSubmit={submit}
              style={{ display: 'flex', gap: 8 }}
            >
              <Input
                value={title}
                onChange={setTitle}
                placeholder={t('newsletter.list.titlePlaceholder')}
                style={{ width: 320 }}
              />
              <RIconButton
                type="submit"
                appearance="primary"
                icon={<MdAdd />}
                loading={creating}
                disabled={!title.trim()}
              >
                {t('newsletter.list.createNew')}
              </RIconButton>
            </form>
          </ListViewActions>
        </PermissionControl>

        <Checkbox
          checked={includeArchived}
          onChange={(_, checked) => setIncludeArchived(checked)}
        >
          {t('newsletter.list.showArchived')}
        </Checkbox>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.newsletterCampaigns ?? []}
        >
          <Column
            width={360}
            resizable
          >
            <HeaderCell>{t('newsletter.list.name')}</HeaderCell>
            <RCell>
              {(row: Row) => (
                <>
                  <Link to={`/newsletter/edit/${row.id}`}>{row.title}</Link>
                  {row.status === NewsletterCampaignStatus.Archived && (
                    <>
                      {' '}
                      <Tag size="sm">{t('newsletter.list.archived')}</Tag>
                    </>
                  )}
                </>
              )}
            </RCell>
          </Column>
          <Column width={100}>
            <HeaderCell>{t('newsletter.list.blocks')}</HeaderCell>
            <RCell dataKey="blockCount" />
          </Column>
          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('newsletter.list.modified')}</HeaderCell>
            <RCell>
              {(row: Row) => new Date(row.modifiedAt).toLocaleString()}
            </RCell>
          </Column>
          <Column
            width={180}
            resizable
          >
            <HeaderCell>{t('newsletter.list.mailchimp')}</HeaderCell>
            <RCell>
              {(row: Row) =>
                row.mailchimpEditUrl ?
                  <a
                    href={row.mailchimpEditUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('newsletter.list.openDraft')}
                  </a>
                : '—'
              }
            </RCell>
          </Column>
          <Column
            width={160}
            align="center"
            fixed="right"
          >
            <HeaderCell>{t('newsletter.list.actions')}</HeaderCell>
            <PaddedCell>
              {(row: Row) => (
                <>
                  <Link
                    to={`/newsletter/preview/${row.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconButton
                      icon={<MdVisibility />}
                      circle
                      size="sm"
                      appearance="ghost"
                      title={t('newsletter.editor.preview')}
                    />
                  </Link>{' '}
                  <PermissionControl
                    qualifyingPermissions={['CAN_CREATE_NEWSLETTER_CAMPAIGN']}
                  >
                    <IconButton
                      icon={<MdContentCopy />}
                      circle
                      size="sm"
                      appearance="ghost"
                      title={t('newsletter.list.duplicate')}
                      disabled={duplicating}
                      onClick={() => duplicate({ variables: { id: row.id } })}
                    />
                  </PermissionControl>{' '}
                  <PermissionControl
                    qualifyingPermissions={['CAN_DELETE_NEWSLETTER_CAMPAIGN']}
                  >
                    {row.status === NewsletterCampaignStatus.Archived ?
                      <IconButton
                        icon={<MdUnarchive />}
                        circle
                        size="sm"
                        appearance="ghost"
                        title={t('newsletter.list.unarchive')}
                        disabled={unarchiving}
                        onClick={() => unarchive({ variables: { id: row.id } })}
                      />
                    : <IconButton
                        icon={<MdArchive />}
                        circle
                        size="sm"
                        appearance="ghost"
                        title={t('newsletter.list.archive')}
                        disabled={archiving}
                        onClick={() => archive({ variables: { id: row.id } })}
                      />
                    }
                  </PermissionControl>
                </>
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NEWSLETTER_CAMPAIGNS',
])(NewsletterCampaignList);
export { CheckedPermissionComponent as NewsletterCampaignList };
