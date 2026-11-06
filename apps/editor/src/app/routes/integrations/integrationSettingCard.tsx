import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material';
import { InfoTooltip } from '@wepublish/ui/editor';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Logo = styled.img`
  min-height: 16px;
  max-height: 28px;
  max-width: 150px;
`;

const lastLoadedFormat = new Intl.DateTimeFormat('de-CH', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export type IntegrationSettingCardProps = {
  name: string;
  type: string | undefined;
  logo: string | undefined;
  lastLoadedAt: string | undefined;
  editPath: string;
  actions: ReactNode;
};

export function IntegrationSettingCard({
  name,
  type,
  logo,
  lastLoadedAt,
  editPath,
  actions,
}: IntegrationSettingCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 1 }}
    >
      <CardContent>
        <Typography
          variant="h5"
          component={Header}
        >
          {name}

          {logo && (
            <Logo
              src={logo}
              alt=""
            />
          )}
        </Typography>

        {type && type !== name && (
          <Typography
            variant="body2"
            color="textSecondary"
          >
            {type}
          </Typography>
        )}

        {lastLoadedAt && (
          <Typography
            align="right"
            color="gray"
          >
            <small>
              {t('integrations.lastLoaded')}:{' '}
              {lastLoadedFormat.format(new Date(lastLoadedAt))}{' '}
              <InfoTooltip text={t('integrations.lastLoadedInfo')} />
            </small>
          </Typography>
        )}
      </CardContent>

      <CardActions>
        <Button
          component={RouterLink}
          to={editPath}
          variant="contained"
          startIcon={<MdEdit />}
          aria-label={t('integrations.editSetting', { name })}
        >
          {t('edit')}
        </Button>

        {actions}
      </CardActions>
    </Card>
  );
}
