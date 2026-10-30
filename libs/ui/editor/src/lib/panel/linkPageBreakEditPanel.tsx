import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { InfoTooltip } from '../atoms/infoTooltip';
import { LinkPageBreakBlockValue } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';

export interface LinkPageBreakEditPanelProps {
  value: LinkPageBreakBlockValue;

  onClose?(): void;
  onChange?(value: LinkPageBreakBlockValue): void;
}

export function LinkPageBreakEditPanel({
  value,
  onClose,
  onChange,
}: LinkPageBreakEditPanelProps) {
  const { linkURL, linkText, linkTarget = '_self', hideButton } = value;

  const { t } = useTranslation();

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('linkPageBreakEditPanel.title')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('linkPageBreakEditPanel.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <Stack
          spacing={3}
          sx={{ width: '100%' }}
        >
          <Stack
            spacing={3}
            sx={{ width: '100%' }}
          >
            <TextField
              label={
                <>
                  {t('linkPageBreakEditPanel.link.urlLabel')}{' '}
                  <InfoTooltip
                    text={t('linkPageBreakEditPanel.link.urlInfo')}
                  />
                </>
              }
              name="link"
              value={linkURL}
              onChange={event =>
                onChange?.({ ...value, linkURL: event.target.value })
              }
              fullWidth
            />

            <TextField
              label={t('linkPageBreakEditPanel.link.buttonLabel')}
              name="link-text"
              value={linkText}
              onChange={event =>
                onChange?.({ ...value, linkText: event.target.value })
              }
              fullWidth
            />

            <FormControl fullWidth>
              <FormLabel>
                {t('linkPageBreakEditPanel.link.targetLabel')}
              </FormLabel>

              <RadioGroup
                name="target_radio"
                row
                onChange={(_event, linkTarget) =>
                  onChange?.({ ...value, linkTarget: linkTarget as string })
                }
                value={linkTarget}
              >
                <FormControlLabel
                  value={'_self'}
                  control={<Radio />}
                  label={t('linkPageBreakEditPanel.link.targetLabelSelf')}
                />

                <FormControlLabel
                  value={'_blank'}
                  control={<Radio />}
                  label={t('linkPageBreakEditPanel.link.targetLabelBlank')}
                />
              </RadioGroup>
            </FormControl>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    onChange={(_event, hideButton) =>
                      onChange?.({ ...value, hideButton })
                    }
                    checked={hideButton}
                  />
                }
                label={t('linkPageBreakEditPanel.link.hideToggleLabel')}
              />
              <FormHelperText>
                {t('linkPageBreakEditPanel.link.hideToogleDescription')}
              </FormHelperText>
            </Box>
          </Stack>
        </Stack>
      </DrawerBody>
    </>
  );
}
