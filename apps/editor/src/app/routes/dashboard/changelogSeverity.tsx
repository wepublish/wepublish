import { Chip } from '@mui/material';
import {
  ChangelogEntryFragment,
  ChangelogSeverity,
} from '@wepublish/editor/api';
import { NotificationSeverity } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

type SeverityOf = Pick<ChangelogEntryFragment, 'severity' | 'confirmedAt'>;

export const isChangelogAction = ({ severity }: Pick<SeverityOf, 'severity'>) =>
  severity !== ChangelogSeverity.Info;

export const isOpenChangelogAction = (entry: SeverityOf) =>
  isChangelogAction(entry) && !entry.confirmedAt;

export const changelogNotificationSeverity = (
  entry: SeverityOf
): NotificationSeverity => {
  if (!isChangelogAction(entry)) {
    return 'info';
  }

  if (entry.confirmedAt) {
    return 'success';
  }

  return entry.severity === ChangelogSeverity.Required ? 'error' : 'warning';
};

const SEVERITY_LABEL: Record<ChangelogSeverity, string> = {
  [ChangelogSeverity.Info]: 'changelog.severity.info',
  [ChangelogSeverity.Recommended]: 'changelog.severity.recommended',
  [ChangelogSeverity.Required]: 'changelog.severity.required',
};

export function ChangelogSeverityChip({
  entry,
  showInfo = false,
}: {
  entry: SeverityOf;
  showInfo?: boolean;
}) {
  const { t } = useTranslation();

  if (!isChangelogAction(entry)) {
    return showInfo ?
        <Chip
          size="small"
          variant="outlined"
          label={t(SEVERITY_LABEL[entry.severity])}
        />
      : null;
  }

  if (entry.confirmedAt) {
    return (
      <Chip
        color="success"
        size="small"
        label={t('changelog.done')}
      />
    );
  }

  return (
    <Chip
      color={
        entry.severity === ChangelogSeverity.Required ? 'error' : 'warning'
      }
      size="small"
      label={t(SEVERITY_LABEL[entry.severity])}
    />
  );
}
