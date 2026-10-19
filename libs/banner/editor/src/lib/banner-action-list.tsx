import {
  CreateBannerActionInput,
  BannerActionRole,
} from '@wepublish/editor/api';
import { InfoTooltip } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Button, Grid, MenuItem, TextField } from '@mui/material';

interface BannerActionListProps {
  actions: CreateBannerActionInput[];
  onAdd: (action: CreateBannerActionInput) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updatedAction: CreateBannerActionInput) => void;
}

export const BannerActionList = ({
  actions,
  onAdd,
  onRemove,
  onUpdate,
}: BannerActionListProps) => {
  const { t } = useTranslation();

  const handleChange = (index: number, field: string, value: string) => {
    const updatedAction = { ...actions[index], [field]: value };
    onUpdate(index, updatedAction);
  };

  return (
    <>
      <Grid
        container
        spacing={2}
      >
        <Grid
          container
          spacing={2}
        >
          <Grid size={{ xs: 3 }}>{t('banner.form.action.label')}</Grid>
          <Grid size={{ xs: 3 }}>{t('banner.form.action.url')}</Grid>
          <Grid size={{ xs: 3 }}>
            {t('banner.form.action.style')}{' '}
            <InfoTooltip text={t('banner.form.action.styleInfo')} />
          </Grid>
          <Grid size={{ xs: 3 }}>
            {t('banner.form.action.role')}{' '}
            <InfoTooltip text={t('banner.form.action.roleInfo')} />
          </Grid>
          <Grid size={{ xs: 2 }}>{t('action')}</Grid>
        </Grid>
        {actions.map((action, index) => (
          <Grid
            container
            spacing={2}
          >
            <Grid size={{ xs: 3 }}>
              <TextField
                value={action.label}
                onChange={event =>
                  handleChange(index, 'label', event.target.value)
                }
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <TextField
                value={action.url}
                onChange={event =>
                  handleChange(index, 'url', event.target.value)
                }
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <TextField
                value={action.style}
                onChange={event =>
                  handleChange(index, 'style', event.target.value)
                }
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <TextField
                select
                value={action.role ?? ''}
                onChange={event => {
                  const value = event.target.value;
                  handleChange(index, 'role', value as string);
                }}
                fullWidth
              >
                {Object.values(BannerActionRole).map(role => (
                  <MenuItem
                    key={role}
                    value={role}
                  >
                    {t(`banner.actions.role.${role}`)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 2 }}>
              <Button
                variant="outlined"
                onClick={() => onRemove(index)}
              >
                {t('banner.list.delete')}
              </Button>
            </Grid>
          </Grid>
        ))}

        <Grid
          container
          spacing={2}
        >
          <Grid size={{ xs: 12 }}>
            <Button
              variant="outlined"
              onClick={() =>
                onAdd({
                  label: '',
                  url: '',
                  style: '',
                  role: BannerActionRole.Other,
                })
              }
            >
              {t('banner.actions.add')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};
