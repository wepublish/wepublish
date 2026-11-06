import { useMutation, useQuery } from '@apollo/client/react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  TextField,
} from '@mui/material';
import {
  ArchiveNewsletterCampaignDocument,
  CreateNewsletterCampaignDocument,
  DuplicateNewsletterCampaignDocument,
  NewsletterCampaignsDocument,
  NewsletterCampaignStatus,
  UnarchiveNewsletterCampaignDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DataTable,
  enqueueSnackbar,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  PermissionControl,
  TableWrapper,
} from '@wepublish/ui/editor';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdArchive,
  MdContentCopy,
  MdUnarchive,
  MdVisibility,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

// Query errors are reported editor-wide by useReportQueryErrors; mutations are not.
const toastError = (error: Error) =>
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });

function NewsletterCampaignList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  const { data, loading, refetch } = useQuery(NewsletterCampaignsDocument, {
    variables: { includeArchived },
  });

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
          <PageTitle>{t('newsletter.list.title')}</PageTitle>
        </ListViewHeader>

        <PermissionControl
          qualifyingPermissions={['CAN_CREATE_NEWSLETTER_CAMPAIGN']}
        >
          <ListViewActions>
            <Box
              component="form"
              onSubmit={submit}
              sx={{ display: 'flex', gap: 1 }}
            >
              <TextField
                size="small"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder={t('newsletter.list.titlePlaceholder')}
                slotProps={{
                  htmlInput: {
                    'aria-label': t('newsletter.list.titlePlaceholder'),
                  },
                }}
                sx={{ width: 320, maxWidth: '100%' }}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<MdAdd />}
                loading={creating}
                disabled={!title.trim()}
              >
                {t('newsletter.list.createNew')}
              </Button>
            </Box>
          </ListViewActions>
        </PermissionControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={includeArchived}
              onChange={(_, checked) => setIncludeArchived(checked)}
            />
          }
          label={t('newsletter.list.showArchived')}
        />
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="newsletter-campaigns"
          data={data?.newsletterCampaigns ?? []}
          loading={loading}
          columns={[
            {
              id: 'title',
              alwaysVisible: true,
              label: t('newsletter.list.name'),
              width: 360,
              render: campaign => (
                <>
                  <Link to={`/newsletter/edit/${campaign.id}`}>
                    {campaign.title}
                  </Link>
                  {campaign.status === NewsletterCampaignStatus.Archived && (
                    <Chip
                      size="small"
                      label={t('newsletter.list.archived')}
                      sx={{ ml: 1 }}
                    />
                  )}
                </>
              ),
            },
            {
              id: 'blocks',
              label: t('newsletter.list.blocks'),
              width: 100,
              render: campaign => campaign.blockCount,
            },
            {
              id: 'modified',
              label: t('newsletter.list.modified'),
              width: 200,
              render: campaign =>
                new Date(campaign.modifiedAt).toLocaleString(),
            },
            {
              id: 'mailchimp',
              label: t('newsletter.list.mailchimp'),
              width: 180,
              render: campaign =>
                campaign.mailchimpEditUrl ?
                  <a
                    href={campaign.mailchimpEditUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('newsletter.list.openDraft')}
                  </a>
                : '—',
            },
            {
              id: 'actions',
              label: t('newsletter.list.actions'),
              width: 160,
              align: 'center',
              fixed: true,
              render: campaign => (
                <>
                  <IconButtonTooltip caption={t('newsletter.editor.preview')}>
                    <IconButton
                      href={`/newsletter/preview/${campaign.id}`}
                      target="_blank"
                      rel="noreferrer"
                      size="small"
                      aria-label={t('newsletter.editor.preview')}
                    >
                      <MdVisibility />
                    </IconButton>
                  </IconButtonTooltip>

                  <PermissionControl
                    qualifyingPermissions={['CAN_CREATE_NEWSLETTER_CAMPAIGN']}
                  >
                    <IconButtonTooltip caption={t('newsletter.list.duplicate')}>
                      <IconButton
                        size="small"
                        aria-label={t('newsletter.list.duplicate')}
                        disabled={duplicating}
                        onClick={() =>
                          duplicate({ variables: { id: campaign.id } })
                        }
                      >
                        <MdContentCopy />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={['CAN_DELETE_NEWSLETTER_CAMPAIGN']}
                  >
                    {campaign.status === NewsletterCampaignStatus.Archived ?
                      <IconButtonTooltip
                        caption={t('newsletter.list.unarchive')}
                      >
                        <IconButton
                          size="small"
                          aria-label={t('newsletter.list.unarchive')}
                          disabled={unarchiving}
                          onClick={() =>
                            unarchive({ variables: { id: campaign.id } })
                          }
                        >
                          <MdUnarchive />
                        </IconButton>
                      </IconButtonTooltip>
                    : <IconButtonTooltip caption={t('newsletter.list.archive')}>
                        <IconButton
                          size="small"
                          aria-label={t('newsletter.list.archive')}
                          disabled={archiving}
                          onClick={() =>
                            archive({ variables: { id: campaign.id } })
                          }
                        >
                          <MdArchive />
                        </IconButton>
                      </IconButtonTooltip>
                    }
                  </PermissionControl>
                </>
              ),
            },
          ]}
        />
      </TableWrapper>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NEWSLETTER_CAMPAIGNS',
])(NewsletterCampaignList);
export { CheckedPermissionComponent as NewsletterCampaignList };
