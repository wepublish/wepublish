import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  SeoCheck,
  SeoCheckKind,
  SeoCheckStatus,
  useSeoChecklistQuery,
} from '@wepublish/editor/api';
import { createCheckedPermissionComponent } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import {
  MdCheck,
  MdClose,
  MdContentCopy,
  MdInfoOutline,
  MdOpenInNew,
  MdRefresh,
  MdWarning,
} from 'react-icons/md';
import { Link } from 'react-router-dom';

const SeoChecklistWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const FullWidth = styled.div`
  grid-column: -1/1;
`;

const Header = styled(FullWidth)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const CardTitle = styled.div`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px;
  align-items: center;
`;

const Detail = styled.code`
  overflow-wrap: anywhere;
`;

const KIND_ORDER = [
  SeoCheckKind.Manual,
  SeoCheckKind.Verifiable,
  SeoCheckKind.Automatic,
];

const EXTERNAL_LINKS: Partial<Record<SeoCheck['id'], string>> = {
  SearchConsole: 'https://search.google.com/search-console',
};

const INTERNAL_LINKS: Partial<Record<SeoCheck['id'], string>> = {
  PublicationMetadata: '/peering/profile/edit',
};

export const groupSeoChecks = (checks: SeoCheck[]) =>
  KIND_ORDER.map(kind => ({
    kind,
    checks: checks.filter(check => check.kind === kind),
  })).filter(group => group.checks.length);

const StatusIcon = ({ status }: { status: SeoCheckStatus }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const label = t(`seoChecklist.status.${status}`);

  switch (status) {
    case SeoCheckStatus.Ok:
      return (
        <MdCheck
          size={24}
          aria-label={label}
          color={theme.palette.success.main}
        />
      );
    case SeoCheckStatus.Warning:
      return (
        <MdWarning
          size={24}
          aria-label={label}
          color={theme.palette.warning.main}
        />
      );
    case SeoCheckStatus.Error:
      return (
        <MdClose
          size={24}
          aria-label={label}
          color={theme.palette.error.main}
        />
      );
    default:
      return (
        <MdInfoOutline
          size={24}
          aria-label={label}
          color={theme.palette.info.main}
        />
      );
  }
};

const SeoCheckCard = ({ check }: { check: SeoCheck }) => {
  const { t } = useTranslation();
  const externalLink = EXTERNAL_LINKS[check.id];
  const internalLink = INTERNAL_LINKS[check.id];

  const hasActions = !!(check.url || externalLink || internalLink);

  return (
    <Card
      variant="outlined"
      sx={{ display: 'flex', flexFlow: 'column' }}
      data-testid={`seo-check-${check.id}`}
      data-status={check.status}
    >
      <CardContent sx={{ flex: 1 }}>
        <Typography
          variant="h6"
          component={CardTitle}
          marginBottom={1}
        >
          <StatusIcon status={check.status} />
          {t(`seoChecklist.checks.${check.id}.title`)}
        </Typography>

        <Typography
          variant="body2"
          marginBottom={1}
        >
          {t(`seoChecklist.checks.${check.id}.${check.status}`)}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {t(`seoChecklist.checks.${check.id}.description`)}
        </Typography>

        {check.detail && (
          <Typography
            variant="body2"
            marginTop={1}
          >
            {t([
              `seoChecklist.checks.${check.id}.detail`,
              'seoChecklist.detail',
            ])}
            : <Detail>{check.detail}</Detail>
          </Typography>
        )}

        {check.url && (
          <Typography
            variant="body2"
            marginTop={1}
          >
            <Detail>{check.url}</Detail>
          </Typography>
        )}
      </CardContent>

      {hasActions && (
        <CardActions>
          {check.url && (
            <>
              <Button
                size="small"
                href={check.url}
                target="_blank"
                rel="noreferrer"
                startIcon={<MdOpenInNew />}
              >
                {t('seoChecklist.open')}
              </Button>

              <Button
                size="small"
                startIcon={<MdContentCopy />}
                onClick={() => navigator.clipboard.writeText(check.url ?? '')}
              >
                {t('seoChecklist.copyUrl')}
              </Button>
            </>
          )}

          {externalLink && (
            <Button
              size="small"
              href={externalLink}
              target="_blank"
              rel="noreferrer"
              startIcon={<MdOpenInNew />}
            >
              {t(`seoChecklist.checks.${check.id}.action`)}
            </Button>
          )}

          {internalLink && (
            <Link to={internalLink}>
              <Button size="small">
                {t(`seoChecklist.checks.${check.id}.action`)}
              </Button>
            </Link>
          )}
        </CardActions>
      )}
    </Card>
  );
};

function SeoChecklist() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useSeoChecklistQuery({
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const groups = groupSeoChecks(data?.seoChecklist.checks ?? []);

  return (
    <SeoChecklistWrapper>
      <Header>
        <div>
          <h3>{t('seoChecklist.title')}</h3>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {t('seoChecklist.description')}
          </Typography>

          {data && (
            <Typography
              variant="body2"
              marginTop={1}
            >
              {t('seoChecklist.websiteUrl')}:{' '}
              <Detail>{data.seoChecklist.websiteUrl}</Detail>
            </Typography>
          )}
        </div>

        <Button
          variant="outlined"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <MdRefresh />}
          onClick={() => refetch()}
        >
          {t('seoChecklist.refresh')}
        </Button>
      </Header>

      {error && (
        <FullWidth>
          <Alert severity="error">{error.message}</Alert>
        </FullWidth>
      )}

      {groups.map(group => (
        <SeoChecklistGroup
          key={group.kind}
          kind={group.kind}
          checks={group.checks}
        />
      ))}
    </SeoChecklistWrapper>
  );
}

const SeoChecklistGroup = ({
  kind,
  checks,
}: {
  kind: SeoCheckKind;
  checks: SeoCheck[];
}) => {
  const { t } = useTranslation();

  return (
    <>
      <FullWidth>
        <Typography variant="h5">
          {t(`seoChecklist.kinds.${kind}.title`)}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {t(`seoChecklist.kinds.${kind}.description`)}
        </Typography>
      </FullWidth>

      {checks.map(check => (
        <SeoCheckCard
          key={check.id}
          check={check}
        />
      ))}
    </>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SETTINGS',
])(SeoChecklist);

export { CheckedPermissionComponent as SeoChecklist };
