import {
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Form } from 'rsuite';

import { InfoTooltip } from '../atoms/infoTooltip';
import { LinkPageBreakBlockValue } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';

export interface LinkPageBreakEditPanelProps {
  readonly value: LinkPageBreakBlockValue;

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
        <Form>
          <Form.Stack fluid>
            <Form.Group controlId="linkUrlLabel">
              <Form.Label>
                {t('linkPageBreakEditPanel.link.urlLabel')}{' '}
                <InfoTooltip text={t('linkPageBreakEditPanel.link.urlInfo')} />
              </Form.Label>

              <Form.Control
                name="link"
                value={linkURL}
                onChange={(linkURL: string) =>
                  onChange?.({ ...value, linkURL })
                }
              />
            </Form.Group>

            <Form.Group controlId="linkButtonLabel">
              <Form.Label>
                {t('linkPageBreakEditPanel.link.buttonLabel')}
              </Form.Label>

              <Form.Control
                name="link-text"
                value={linkText}
                onChange={(linkText: string) =>
                  onChange?.({ ...value, linkText })
                }
              />
            </Form.Group>

            <Form.Group controlId="target_radio">
              <Form.Label>
                {t('linkPageBreakEditPanel.link.targetLabel')}
              </Form.Label>

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
            </Form.Group>

            <Form.Group controlId="linkHideToggle">
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
              <Form.Text>
                {t('linkPageBreakEditPanel.link.hideToogleDescription')}
              </Form.Text>
            </Form.Group>
          </Form.Stack>
        </Form>
      </DrawerBody>
    </>
  );
}
