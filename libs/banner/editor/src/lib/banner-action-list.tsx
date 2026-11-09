import {
  CreateBannerActionInput,
  BannerActionRole,
} from '@wepublish/editor/api';
import { InfoTooltip } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import { useEffect, useRef } from 'react';

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
  const labelRefs = useRef<(HTMLInputElement | null)[]>([]);
  const removeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const addRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<
    { kind: 'added' } | { kind: 'removed'; index: number } | null
  >(null);

  useEffect(() => {
    const pending = pendingFocus.current;
    pendingFocus.current = null;

    if (pending?.kind === 'added') {
      labelRefs.current[actions.length - 1]?.focus();
    }

    if (pending?.kind === 'removed') {
      const next = Math.min(pending.index, actions.length - 1);
      const target = next >= 0 ? removeRefs.current[next] : addRef.current;
      target?.focus();
    }
  }, [actions.length]);

  const handleChange = (index: number, field: string, value: string) => {
    const updatedAction = { ...actions[index], [field]: value };
    onUpdate(index, updatedAction);
  };

  return (
    <Grid
      container
      spacing={2}
      sx={{ marginTop: 2 }}
    >
      {actions.map((action, index) => (
        <Grid
          key={index}
          container
          spacing={2}
          size={{ xs: 12 }}
          role="group"
          aria-label={t('banner.form.action.group', { number: index + 1 })}
        >
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label={t('banner.form.action.label')}
              value={action.label}
              inputRef={(element: HTMLInputElement | null) => {
                labelRefs.current[index] = element;
              }}
              onChange={event =>
                handleChange(index, 'label', event.target.value)
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label={t('banner.form.action.url')}
              value={action.url}
              onChange={event => handleChange(index, 'url', event.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              label={t('banner.form.action.style')}
              value={action.style}
              onChange={event =>
                handleChange(index, 'style', event.target.value)
              }
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <InfoTooltip text={t('banner.form.action.styleInfo')} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TextField
                select
                label={t('banner.form.action.role')}
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
              <InfoTooltip text={t('banner.form.action.roleInfo')} />
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, md: 2 }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Button
              variant="outlined"
              ref={element => {
                removeRefs.current[index] = element;
              }}
              onClick={() => {
                pendingFocus.current = { kind: 'removed', index };
                onRemove(index);
              }}
            >
              {t('banner.list.delete')}
            </Button>
          </Grid>
        </Grid>
      ))}

      <Grid size={{ xs: 12 }}>
        <Button
          variant="outlined"
          ref={addRef}
          onClick={() => {
            pendingFocus.current = { kind: 'added' };
            onAdd({
              label: '',
              url: '',
              style: '',
              role: BannerActionRole.Other,
            });
          }}
        >
          {t('banner.actions.add')}
        </Button>
      </Grid>
    </Grid>
  );
};
