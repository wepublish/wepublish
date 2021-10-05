import React from 'react'

import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Toggle,
  HelpBlock,
  SelectPicker,
  RadioGroup,
  Radio
} from 'rsuite'

import {useTranslation} from 'react-i18next'
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
      </Drawer.Header>

      <Drawer.Body>
        <Form fluid={true}>
          <FormGroup>
            <ControlLabel>{t('linkPageBreakEditPanel.style.label')}</ControlLabel>
            <SelectPicker
              block
              data={STYLE_OPTIONS.map(style => ({
                value: style.id,
                label: t(`linkPageBreakEditPanel.style.${style.id}`)
              }))}
              value={styleOption}
              onChange={styleOption =>
                onChange?.({
                  ...value,
                  styleOption,
                  layoutOption:
                    styleOption === STYLE_OPTIONS[2].id ? LAYOUT_OPTIONS[0].id : value.layoutOption
                })
              }
            />
          </FormGroup>

          <FormGroup>
            <ControlLabel>{t('linkPageBreakEditPanel.layout.label')}</ControlLabel>
            <SelectPicker
              block
              data={LAYOUT_OPTIONS.filter(
                layout => styleOption !== STYLE_OPTIONS[2].id || !layout.disabledIfImageStyle
              ).map(layout => ({
                value: layout.id,
                label: t(`linkPageBreakEditPanel.layout.${layout.id}`)
              }))}
              value={layoutOption}
              onChange={layoutOption => onChange?.({...value, layoutOption})}
            />
          </FormGroup>

          <FormGroup>
            <ControlLabel>{t('linkPageBreakEditPanel.template.label')}</ControlLabel>
            <SelectPicker
              block
              data={TEMPLATE_OPTIONS.map(template => ({
                value: template.id,
                label: t(`linkPageBreakEditPanel.template.${template?.id}`)
              }))}
              value={templateOption}
              onChange={templateOption => onChange?.({...value, templateOption})}
            />
          </FormGroup>

          <FormGroup>
            <ControlLabel>{t('linkPageBreakEditPanel.link.urlLabel')}</ControlLabel>
            <FormControl value={linkURL} onChange={linkURL => onChange?.({...value, linkURL})} />
          </FormGroup>

          <FormGroup>
            <ControlLabel>{t('linkPageBreakEditPanel.link.buttonLabel')}</ControlLabel>
            <FormControl value={linkText} onChange={linkText => onChange?.({...value, linkText})} />
          </FormGroup>

          <FormGroup controlId="target_radio">
            <ControlLabel>{t('linkPageBreakEditPanel.link.targetLabel')}</ControlLabel>
            <RadioGroup
              name="target_radio"
              inline={true}
              onChange={linkTarget => onChange?.({...value, linkTarget})}
              value={linkTarget}>
              <Radio value={'_self'}>{t('linkPageBreakEditPanel.link.targetLabelSelf')}</Radio>
              <Radio value={'_blank'}>{t('linkPageBreakEditPanel.link.targetLabelBlank')}</Radio>
            </RadioGroup>
          </FormGroup>

          <FormGroup>
            <ControlLabel>{t('linkPageBreakEditPanel.link.hideToggleLabel')}</ControlLabel>
            <Toggle
              onChange={hideButton => onChange?.({...value, hideButton})}
              checked={hideButton}
            />
            <HelpBlock>{t('linkPageBreakEditPanel.link.hideToogleDescription')}</HelpBlock>
          </FormGroup>
        </Form>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('linkPageBreakEditPanel.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
