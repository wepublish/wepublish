import React, {useState} from 'react'

import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Toggle,
  HelpBlock,
  Nav,
  Icon,
  Panel
} from 'rsuite'

import {useTranslation} from 'react-i18next'
import {MetaDataType} from '../blocks/types'

export interface ArticleMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface ContentMetadata {
  readonly title: string
  readonly shared: boolean
}

export interface CustomContentMetadataPanelProps {
  readonly value: ContentMetadata

  onClose?(): void
  onChange?(value: ContentMetadata): void
}

export function CustomContentMetadataPanel({
  value,
  onClose,
  onChange
}: CustomContentMetadataPanelProps) {
  const {title, shared} = value

  const [activeKey, setActiveKey] = useState(MetaDataType.General)
  const {t} = useTranslation()

  function currentContent() {
    switch (activeKey) {
      case MetaDataType.General:
        return (
          <Panel>
            <Form fluid={true}>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.title')}</ControlLabel>
                <FormControl value={title} onChange={title => onChange?.({...value, title})} />
              </FormGroup>
              {/* <FormGroup>
                <ControlLabel>Slug</ControlLabel>
                <FormControl
                  value={slug}
                  onChange={slug => onChange?.({...value, slug: slugify(slug)})}
                />
              </FormGroup> */}
            </Form>
            <Form fluid={true} style={{marginTop: '20px'}}>
              <FormGroup>
                <ControlLabel>{t('articleEditor.panels.peering')}</ControlLabel>
                <Toggle checked={shared} onChange={shared => onChange?.({...value, shared})} />
                <HelpBlock>{t('articleEditor.panels.allowPeerPublishing')}</HelpBlock>
              </FormGroup>
            </Form>
          </Panel>
        )
      default:
        return <></>
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.metadata')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Nav
          appearance="tabs"
          activeKey={activeKey}
          onSelect={activeKey => setActiveKey(activeKey)}
          style={{marginBottom: 20}}>
          <Nav.Item eventKey={MetaDataType.General} icon={<Icon icon="cog" />}>
            {t('articleEditor.panels.general')}
          </Nav.Item>
        </Nav>
        {currentContent()}
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
