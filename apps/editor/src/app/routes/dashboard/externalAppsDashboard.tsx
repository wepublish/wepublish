import styled from '@emotion/styled';
import {
  Box,
  Card,
  CardActionArea,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import {
  ExternalAppsTarget,
  useExternalAppsQuery,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { MdExtension } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { ICON_REGISTRY } from '../externalApps/iconRegistry';

const AppGrid = styled(Grid)`
  padding: 16px;
`;

const AppBox = styled(Box)`
  min-height: 120px;
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
`;

const AppIconBox = styled(Box)`
  font-size: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.palette?.primary?.main || '#2196f3'};
`;

const EmptyText = styled(Typography)`
  padding: 24px;
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
  const { data, loading, error } = useExternalAppsQuery({
    fetchPolicy: 'cache-and-network',
  });

  if (loading) {
    return (
      <Box
        p={3}
        display="flex"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        p={3}
        color="error.main"
      >
        {error.message}
      </Box>
    );
  }

  const apps = data?.externalApps || [];

  if (apps.length === 0) {
    return (
      <EmptyText color="textSecondary">
        {t('externalApps.noAppsFound', {
          defaultValue: 'No external apps configured.',
        })}
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
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
          key={app.id}
        >
          <Card
            variant="outlined"
            sx={{ height: '100%' }}
          >
            <CardActionArea
              component="div"
              onClick={() => {
                if (app.target === ExternalAppsTarget.Blank) {
                  window.open(app.url, '_blank', 'noopener,noreferrer');
                } else if (app.target === ExternalAppsTarget.Iframe) {
                  navigate(`/external-app/${app.id}`);
                }
              }}
              sx={{ height: '100%' }}
            >
              <AppBox p={2}>
                <AppIconBox>
                  <AppIcon iconName={app.icon} />
                </AppIconBox>
                <Typography
                  variant="h6"
                  component="div"
                  noWrap
                  sx={{
                    width: '100%',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {app.name}
                </Typography>
              </AppBox>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </AppGrid>
  );
}
