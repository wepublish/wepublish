import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Box,
  Card,
  CardActionArea,
  CircularProgress,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ExternalAppsDocument,
  ExternalAppsTarget,
} from '@wepublish/editor/api';
import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdExtension } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { ApiKeyWarning } from '../externalApps/apiKeyWarning';
import { ICON_REGISTRY } from '../externalApps/iconRegistry';
import { openExternalApp } from '../externalApps/openExternalApp';
import { useMintExternalAppToken } from '../externalApps/useExternalAppSrc';

const AppGrid = styled(Grid)`
  padding: ${({ theme }) => theme.spacing(4)};
`;

const AppBox = styled(Box)`
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const AppIconBox = styled(Box)`
  font-size: ${({ theme }) => theme.typography.h3.fontSize};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.vars.palette.primary.main};
`;

const EmptyText = styled(Typography)`
  padding: ${({ theme }) => theme.spacing(3)};
  text-align: center;
`;

interface AppIconProps {
  iconName?: string | null;
}

function AppIcon({ iconName }: AppIconProps) {
  if (!iconName || !ICON_REGISTRY[iconName]) {
    return <MdExtension />;
  }

  const RegisteredIcon = ICON_REGISTRY[iconName].icon;
  return <RegisteredIcon />;
}

export function ExternalAppsDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(ExternalAppsDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const mintToken = useMintExternalAppToken();

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          p: 3,
          color: 'error.main',
        }}
      >
        {humanizeError(error)}
      </Box>
    );
  }

  const apps = data?.externalApps || [];

  if (apps.length === 0) {
    return (
      <EmptyText color="textSecondary">
        {t('externalApps.noAppsFound')}
      </EmptyText>
    );
  }

  return (
    <AppGrid
      container
      spacing={3}
    >
      {apps.map(app => (
        <Grid
          size={{ xs: 12, sm: 6, md: 4 }}
          key={app.id}
        >
          <Card
            variant="outlined"
            sx={{ height: '100%' }}
          >
            <CardActionArea
              onClick={() => {
                if (app.target === ExternalAppsTarget.Blank) {
                  openExternalApp(app.url, () => mintToken(app.id)).catch(
                    (mintError: unknown) =>
                      enqueueSnackbar(humanizeError(mintError), {
                        variant: 'error',
                      })
                  );
                } else if (app.target === ExternalAppsTarget.Iframe) {
                  navigate(`/external-app/${app.id}`);
                }
              }}
              sx={{ height: '100%' }}
            >
              <AppBox sx={{ p: 2 }}>
                <AppIconBox style={{ color: '#ea726e' }}>
                  <AppIcon iconName={app.icon} />
                </AppIconBox>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ lineHeight: '1.15em' }}
                >
                  {app.name}
                </Typography>
                {app.description && (
                  <Tooltip
                    title={app.description}
                    placement="top"
                  >
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{
                        mt: 1,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3,
                      }}
                    >
                      {app.description}
                    </Typography>
                  </Tooltip>
                )}
                <ApiKeyWarning apiToken={app.apiToken} />
              </AppBox>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </AppGrid>
  );
}
