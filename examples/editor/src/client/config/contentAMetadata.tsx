import React from 'react'
import {ControlLabel, Form, FormControl, FormGroup, Toggle, HelpBlock, Panel} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {ContentA_EditView, ContentA_EditViewValue} from './contentA'

export interface DefaultMetadata {
  readonly title: string
  readonly shared: boolean
}

export interface ContentMetadataPanelProps {
  readonly defaultMetadata: DefaultMetadata
  readonly customMetadata: ContentA_EditViewValue
  onChangeDefaultMetadata?(defaultMetadata: DefaultMetadata): void
  onChangeCustomMetadata?(customMetadata: ContentA_EditViewValue): void
}

export function ContentMetadataPanel({
  defaultMetadata,
  customMetadata,
  onChangeDefaultMetadata,
  onChangeCustomMetadata
}: ContentMetadataPanelProps) {
  const {title, shared} = defaultMetadata
  const {t} = useTranslation()

  return (
    <Panel>
      <Form fluid={true}>
        <FormGroup>
          <ControlLabel>{t('articleEditor.panels.title')}</ControlLabel>
          <FormControl
            value={title}
            onChange={title => onChangeDefaultMetadata?.({...defaultMetadata, title})}
          />
        </FormGroup>
      </Form>
      <Form fluid={true} style={{marginTop: '20px'}}>
        <FormGroup>
          <ControlLabel>{t('articleEditor.panels.peering')}</ControlLabel>
          <Toggle
            checked={shared}
            onChange={shared => onChangeDefaultMetadata?.({...defaultMetadata, shared})}
          />
          <HelpBlock>{t('articleEditor.panels.allowPeerPublishing')}</HelpBlock>
        </FormGroup>
      </Form>
      <hr></hr>
      <ContentA_EditView value={customMetadata} onChange={onChangeCustomMetadata as any} />
    </Panel>
  )
}
