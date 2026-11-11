import { Chip, ChipProps } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  MdCheckCircle,
  MdPauseCircle,
  MdRadioButtonUnchecked,
  MdWarning,
} from 'react-icons/md';

import { IntegrationStatus } from './integrationStatus';

const chipProps: Record<
  IntegrationStatus['state'],
  Pick<ChipProps, 'color' | 'icon'>
> = {
  notSetUp: { color: 'default', icon: <MdRadioButtonUnchecked /> },
  ready: { color: 'success', icon: <MdCheckCircle /> },
  incomplete: { color: 'warning', icon: <MdWarning /> },
  paused: { color: 'info', icon: <MdPauseCircle /> },
};

export function IntegrationStatusChip({
  status,
}: {
  status: IntegrationStatus;
}) {
  const { t } = useTranslation();
  const label = {
    notSetUp: t('integrations.status.notSetUp'),
    ready: t('integrations.status.ready'),
    incomplete: t('integrations.status.incomplete'),
    paused: t('integrations.status.paused'),
  }[status.state];

  return (
    <Chip
      size="small"
      variant={status.state === 'notSetUp' ? 'outlined' : 'filled'}
      label={label}
      {...chipProps[status.state]}
    />
  );
}
