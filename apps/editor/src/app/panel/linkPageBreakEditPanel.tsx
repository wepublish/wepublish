import {useTranslation} from 'react-i18next'
import {Button, Drawer, Form, Radio, RadioGroup, SelectPicker, Toggle} from 'rsuite'

import {LinkPageBreakBlockValue} from '../blocks/types'

export interface LinkPageBreakEditPanelProps {
  readonly value: LinkPageBreakBlockValue

  onClose?(): void
  onChange?(value: LinkPageBreakBlockValue): void
}

const STYLE_OPTIONS = [{id: 'default'}, {id: 'dark'}, {id: 'image'}]

const LAYOUT_OPTIONS = [
  {id: 'default', disabledIfImageStyle: false},
  {id: 'right', disabledIfImageStyle: true},
  {id: 'center', disabledIfImageStyle: true},
  {id: 'image-right', disabledIfImageStyle: true},
  {id: 'image-left', disabledIfImageStyle: true}
]

const TEMPLATE_OPTIONS = [{id: 'none'}, {id: 'donation'}, {id: 'membership'}, {id: 'subscription'}]

export function LinkPageBreakEditPanel({value, onClose, onChange}: LinkPageBreakEditPanelProps) {
  const {
    styleOption,
    layoutOption,
    linkURL,
    linkText,
    linkTarget = '_self',
    hideButton,
    templateOption
  } = value

  const {t} = useTranslation()

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('linkPageBreakEditPanel.title')}</Drawer.Title>

        <Drawer.Actions>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('linkPageBreakEditPanel.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Form fluid>
          <Form.Group controlId="styleLabel">
            <Form.ControlLabel>{t('linkPageBreakEditPanel.style.label')}</Form.ControlLabel>
            <SelectPicker
              block
              virtualized
              data={STYLE_OPTIONS.map(style => ({
                value: style.id,
                label: t(`linkPageBreakEditPanel.style.${style.id}`)
              }))}
              value={styleOption}
              onChange={styleOption =>
                onChange?.({
                  ...value,
                  styleOption: styleOption ?? undefined,
                  layoutOption:
                    styleOption === STYLE_OPTIONS[2].id ? LAYOUT_OPTIONS[0].id : value.layoutOption
                })
              }
            />
          </Form.Group>

          <Form.Group controlId="layoutLabel">
            <Form.ControlLabel>{t('linkPageBreakEditPanel.layout.label')}</Form.ControlLabel>
            <SelectPicker
              block
              virtualized
              data={LAYOUT_OPTIONS.filter(
                layout => styleOption !== STYLE_OPTIONS[2].id || !layout.disabledIfImageStyle
              ).map(layout => ({
                value: layout.id,
                label: t(`linkPageBreakEditPanel.layout.${layout.id}`)
              }))}
              value={layoutOption}
              onChange={layoutOption =>
                onChange?.({...value, layoutOption: layoutOption ?? undefined})
              }
            />
          </Form.Group>

          <Form.Group controlId="templateLabel">
            <Form.ControlLabel>{t('linkPageBreakEditPanel.template.label')}</Form.ControlLabel>
            <SelectPicker
              block
              virtualized
              data={TEMPLATE_OPTIONS.map(template => ({
                value: template.id,
                label: t(`linkPageBreakEditPanel.template.${template?.id}`)
              }))}
              value={templateOption}
              onChange={templateOption =>
                onChange?.({...value, templateOption: templateOption ?? undefined})
              }
            />
          </Form.Group>

          <Form.Group controlId="linkUrlLabel">
            <Form.ControlLabel>{t('linkPageBreakEditPanel.link.urlLabel')}</Form.ControlLabel>
            <Form.Control
              name="link"
              value={linkURL}
              onChange={(linkURL: string) => onChange?.({...value, linkURL})}
            />
          </Form.Group>

          <Form.Group controlId="linkButtonLabel">
            <Form.ControlLabel>{t('linkPageBreakEditPanel.link.buttonLabel')}</Form.ControlLabel>
            <Form.Control
              name="link-text"
              value={linkText}
              onChange={(linkText: string) => onChange?.({...value, linkText})}
            />
          </Form.Group>

          <Form.Group controlId="target_radio">
            <Form.ControlLabel>{t('linkPageBreakEditPanel.link.targetLabel')}</Form.ControlLabel>
            <RadioGroup
              name="target_radio"
              inline
              onChange={linkTarget => onChange?.({...value, linkTarget: linkTarget as string})}
              value={linkTarget}>
              <Radio value={'_self'}>{t('linkPageBreakEditPanel.link.targetLabelSelf')}</Radio>
              <Radio value={'_blank'}>{t('linkPageBreakEditPanel.link.targetLabelBlank')}</Radio>
            </RadioGroup>
          </Form.Group>

          <Form.Group controlId="linkHideToggle">
            <Form.ControlLabel>
              {t('linkPageBreakEditPanel.link.hideToggleLabel')}
            </Form.ControlLabel>
            <Toggle
              onChange={hideButton => onChange?.({...value, hideButton})}
              checked={hideButton}
            />
            <Form.HelpText>{t('linkPageBreakEditPanel.link.hideToogleDescription')}</Form.HelpText>
          </Form.Group>
        </Form>
      </Drawer.Body>
    </>
  )
}
