import styled from '@emotion/styled';
import { FormControlLabel, Switch, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useAutosaveEnabled } from './useAutosaveEnabled';

const Label = styled(FormControlLabel)`
  flex-shrink: 0;
  gap: ${({ theme }) => theme.spacing(0.75)};
  margin: 0;
  color: ${({ theme }) => theme.vars.palette.text.secondary};

  .MuiFormControlLabel-label {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }
`;

export interface AutosaveToggleProps {
  disabled?: boolean;
}

export function AutosaveToggle({ disabled }: AutosaveToggleProps) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useAutosaveEnabled();

  return (
    <Tooltip
      describeChild
      title={t('autosave.description')}
    >
      <Label
        control={
          <Switch
            size="small"
            checked={enabled}
            disabled={disabled}
            onChange={(_event, checked) => setEnabled(checked)}
          />
        }
        label={t('autosave.label')}
      />
    </Tooltip>
  );
}
