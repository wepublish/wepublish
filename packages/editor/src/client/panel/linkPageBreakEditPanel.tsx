import React from 'react'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Spacing,
  Toggle,
  Select,
  Radio,
  RadioGroup
} from '@karma.run/ui'

import {MaterialIconClose} from '@karma.run/icons'

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
      <Panel>
        <PanelHeader
          title={t('articleEditor.panels.metadata')}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('articleEditor.panels.close')}
              onClick={() => onClose?.()}
            />
          }
        />

        <PanelSection>
          <Select
            label={t('linkPageBreakEditPanel.style.label')}
            options={STYLE_OPTIONS}
            value={{id: styleOption ?? STYLE_OPTIONS[0].id}}
            renderListItem={value => t(`linkPageBreakEditPanel.style.${value?.id}`)}
            onChange={styleOption =>
              onChange?.({
                ...value,
                styleOption: styleOption?.id,
                layoutOption:
                  styleOption?.id === STYLE_OPTIONS[2].id
                    ? LAYOUT_OPTIONS[0].id
                    : value.layoutOption
              })
            }
            marginBottom={Spacing.Small}
          />

          <Select
            label={t('linkPageBreakEditPanel.layout.label')}
            options={LAYOUT_OPTIONS.filter(
              layout => layout.disabledIfImageStyle && styleOption === STYLE_OPTIONS[2].id
            )}
            value={LAYOUT_OPTIONS.find(layout => layout.id === layoutOption)}
            renderListItem={value => t(`linkPageBreakEditPanel.layout.${value?.id}`)}
            onChange={layoutOption => onChange?.({...value, layoutOption: layoutOption?.id})}
          />

          <Select
            label={t('linkPageBreakEditPanel.template.label')}
            options={TEMPLATE_OPTIONS}
            value={TEMPLATE_OPTIONS.find(template => template.id === templateOption)}
            renderListItem={value => t(`linkPageBreakEditPanel.template.${value?.id}`)}
            onChange={templateOption => onChange?.({...value, templateOption: templateOption?.id})}
          />

          <TextInput
            placeholder={t('linkPageBreakEditPanel.link.urlPlaceholder')}
            label={t('linkPageBreakEditPanel.link.urlLabel')}
            value={linkURL}
            onChange={e => onChange?.({...value, linkURL: e.target.value})}
          />

          <TextInput
            label={t('linkPageBreakEditPanel.link.buttonLabel')}
            value={linkText}
            onChange={e => onChange?.({...value, linkText: e.target.value})}
          />

          <RadioGroup
            name={'target_radio'}
            onChange={e => onChange?.({...value, linkTarget: e.target.value})}
            value={linkTarget}>
            <Radio value={'_self'} label={t('linkPageBreakEditPanel.link.targetLabelSelf')} />
            <Radio value={'_blank'} label={t('linkPageBreakEditPanel.link.targetLabelBlank')} />
          </RadioGroup>

          <Toggle
            label={t('linkPageBreakEditPanel.link.hideToggleLabel')}
            description={t('linkPageBreakEditPanel.link.hideToogleDescription')}
            onChange={e => onChange?.({...value, hideButton: e.target.checked})}
            checked={hideButton}
          />
        </PanelSection>
      </Panel>
    </>
  )
}
