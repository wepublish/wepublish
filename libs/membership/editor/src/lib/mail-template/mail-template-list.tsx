import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  css,
  keyframes,
} from '@mui/material';
import {
  useMailTemplateQuery,
  useSynchronizeMailTemplatesMutation,
} from '@wepublish/editor/api';
import {
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  createCheckedPermissionComponent,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdCheck, MdDataObject, MdSync, MdWarning } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, Stack } from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';

const spinAnimation = keyframes`
  0% {
    transform: rotate(359deg);
  }

  100% {
    transform: rotate(0deg);
  }
`;

const iconSpin = css`
  animation: ${spinAnimation} 2s infinite linear;
`;

function MailTemplateList() {
  const { t } = useTranslation();

  const { data: queryData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());

  const [syncTemplates, { loading: mutationLoading }] =
    useSynchronizeMailTemplatesMutation({
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailTemplate'],
    });

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noreferrer');
  };

  return (
    <>
      <Stack justifyContent={'space-between'}>
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('mailTemplates.availableTemplates')}</h2>

            <Typography variant="subtitle1">
              {t('mailTemplates.explanation', {
                provider: queryData?.provider.name,
              })}
            </Typography>
          </ListViewHeader>
        </ListViewContainer>

        <PermissionControl
          showRejectionMessage={false}
          qualifyingPermissions={['CAN_SYNC_MAIL-TEMPLATES']}
        >
          <Button
            appearance="primary"
            onClick={() => syncTemplates()}
          >
            <MdSync css={mutationLoading ? iconSpin : undefined} />
            {t('mailTemplates.synchronize')}
          </Button>
        </PermissionControl>
      </Stack>

      <TableContainer style={{ marginTop: '16px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>{t('mailTemplates.name')}</strong>
              </TableCell>

              <TableCell>
                <strong>{t('mailTemplates.description')}</strong>
              </TableCell>

              <TableCell>
                <strong>{t('mailTemplates.content')}</strong>
              </TableCell>

              <TableCell>
                <strong>{t('mailTemplates.showPlaceholders')}</strong>
              </TableCell>

              <TableCell>
                <strong>{t('mailTemplates.status')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {queryData &&
              queryData.mailTemplates.map(template => (
                <TableRow key={template.id.toString()}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>
                    {template.remoteMissing ?
                      ''
                    : <Button
                        appearance="default"
                        onClick={() => openInNewTab(template.url)}
                      >
                        {t('mailTemplates.view', {
                          provider: queryData?.provider.name,
                        })}
                      </Button>
                    }
                  </TableCell>
                  <TableCell>
                    <Link to="/mailtemplates/placeholders">
                      <Button
                        appearance="default"
                        endIcon={<MdDataObject />}
                      >
                        {t('mailTemplates.goToPlaceholders')}
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {template.status === 'ok' ?
                      <MdCheck />
                    : <>
                        <MdWarning />{' '}
                        {t(`mailTemplates.statuses.${template.status}`, {
                          provider: queryData?.provider.name,
                          internalName: template.externalMailTemplateId,
                        })}
                      </>
                    }
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-TEMPLATES',
  'CAN_SYNC_MAIL-TEMPLATES',
])(MailTemplateList);
export { CheckedPermissionComponent as MailTemplateList };
