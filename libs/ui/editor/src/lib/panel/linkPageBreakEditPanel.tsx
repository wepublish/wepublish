import { useTranslation } from 'react-i18next';
import { Button, Drawer, Form, Radio, RadioGroup, Toggle } from 'rsuite';

import { LinkPageBreakBlockValue } from '../blocks/types';

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
      <Drawer.Header>
        <Drawer.Title>{t('linkPageBreakEditPanel.title')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {t('linkPageBreakEditPanel.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Form fluid>
          <Form.Group controlId="linkUrlLabel">
            <Form.ControlLabel>
              {t('linkPageBreakEditPanel.link.urlLabel')}
            </Form.ControlLabel>
            <Form.Control
              name="link"
              value={linkURL}
              onChange={(linkURL: string) => onChange?.({ ...value, linkURL })}
            />
          </Form.Group>

          <Form.Group controlId="linkButtonLabel">
            <Form.ControlLabel>
              {t('linkPageBreakEditPanel.link.buttonLabel')}
            </Form.ControlLabel>
            <Form.Control
              name="link-text"
              value={linkText}
              onChange={(linkText: string) =>
                onChange?.({ ...value, linkText })
              }
            />
          </Form.Group>

          <Form.Group controlId="target_radio">
            <Form.ControlLabel>
              {t('linkPageBreakEditPanel.link.targetLabel')}
            </Form.ControlLabel>
            <RadioGroup
              name="target_radio"
              inline
              onChange={linkTarget =>
                onChange?.({ ...value, linkTarget: linkTarget as string })
              }
              value={linkTarget}
            >
              <Radio value={'_self'}>
                {t('linkPageBreakEditPanel.link.targetLabelSelf')}
              </Radio>
              <Radio value={'_blank'}>
                {t('linkPageBreakEditPanel.link.targetLabelBlank')}
              </Radio>
            </RadioGroup>
          </Form.Group>

          <Form.Group controlId="linkHideToggle">
            <Form.ControlLabel>
              {t('linkPageBreakEditPanel.link.hideToggleLabel')}
            </Form.ControlLabel>
            <Toggle
              onChange={hideButton => onChange?.({ ...value, hideButton })}
              checked={hideButton}
            />
            <Form.HelpText>
              {t('linkPageBreakEditPanel.link.hideToogleDescription')}
            </Form.HelpText>
          </Form.Group>
        </Form>
      </Drawer.Body>
    </>
  );
}
