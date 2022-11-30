import React, {useState} from 'react'
import {TFunction, useTranslation} from 'react-i18next'
import {Button, Drawer, Form, Input, Panel, Radio, RadioGroup, Toggle} from 'rsuite'

import {TeaserStyle} from '../api'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {ListInput, ListValue} from '../atoms/listInput'
import {Teaser, TeaserType} from '../blocks/types'
import {generateID} from '../utility'
import {ImageEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

export interface TeaserMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface TeaserEditPanelProps {
  initialTeaser: Teaser

  closeLabel?: string

  onClose: () => void
  onConfirm: (teaser: Teaser) => void
}

export function TeaserEditPanel({
  initialTeaser,
  onClose,
  onConfirm,
  closeLabel = 'Close'
}: TeaserEditPanelProps) {
  const [style, setStyle] = useState(initialTeaser.style)
  const [image, setImage] = useState(initialTeaser.image)
  const [contentUrl, setContentUrl] = useState(
    initialTeaser.type === TeaserType.Custom ? initialTeaser.contentUrl : undefined
  )
  const [preTitle, setPreTitle] = useState(initialTeaser.preTitle)
  const [title, setTitle] = useState(initialTeaser.title)
  const [lead, setLead] = useState(initialTeaser.lead)
  const [metaDataProperties, setMetadataProperties] = useState<ListValue<TeaserMetadataProperty>[]>(
    initialTeaser.type === TeaserType.Custom && initialTeaser.properties
      ? initialTeaser.properties.map(metaDataProperty => ({
          id: generateID(),
          value: metaDataProperty
        }))
      : []
  )

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {t} = useTranslation()

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.editTeaser')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'primary'}
            onClick={() => {
              onConfirm({
                ...initialTeaser,
                style,
                preTitle: preTitle || undefined,
                title: title || undefined,
                lead: lead || undefined,
                image,
                ...(initialTeaser.type === TeaserType.Custom && {
                  contentUrl: contentUrl || undefined,
                  properties: metaDataProperties.map(({value}) => value) || undefined
                })
              })
            }}>
            {t('articleEditor.panels.confirm')}
          </Button>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {closeLabel}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        {previewForTeaser(initialTeaser, t)}
        <Panel header={t('articleEditor.panels.displayOptions')}>
          <Form fluid>
            <Form.Group controlId="articleStyle">
              <Form.ControlLabel>{t('articleEditor.panels.style')}</Form.ControlLabel>
              <RadioGroup
                inline
                value={style}
                onChange={teaserStyle => setStyle(teaserStyle as TeaserStyle)}>
                <Radio value={TeaserStyle.Default}>{t('articleEditor.panels.default')}</Radio>
                <Radio value={TeaserStyle.Light}>{t('articleEditor.panels.light')}</Radio>
                <Radio value={TeaserStyle.Text}>{t('articleEditor.panels.text')}</Radio>
              </RadioGroup>
            </Form.Group>
            <Form.Group controlId="articlePreTitle">
              <Form.ControlLabel>{t('articleEditor.panels.preTitle')}</Form.ControlLabel>
              <Form.Control
                name="pre-title"
                value={preTitle}
                onChange={(preTitle: string) => setPreTitle(preTitle)}
              />
            </Form.Group>
            <Form.Group controlId="articleTitle">
              <Form.ControlLabel>{t('articleEditor.panels.title')}</Form.ControlLabel>
              <Form.Control
                name="title"
                value={title}
                onChange={(title: string) => setTitle(title)}
              />
            </Form.Group>
            <Form.Group controlId="articleLead">
              <Form.ControlLabel>{t('articleEditor.panels.lead')}</Form.ControlLabel>
              <Form.Control name="lead" value={lead} onChange={(lead: string) => setLead(lead)} />
            </Form.Group>
            {initialTeaser.type === TeaserType.Custom && (
              <>
                <Form.Group controlId="contentUrl">
                  <Form.ControlLabel>{t('articleEditor.panels.contentUrl')}</Form.ControlLabel>
                  <Form.Control
                    name="content-url"
                    value={contentUrl}
                    onChange={(contentUrl: string) => setContentUrl(contentUrl)}
                  />
                </Form.Group>
                <Form.Group controlId="properties">
                  <Form.ControlLabel>{t('articleEditor.panels.properties')}</Form.ControlLabel>
                  <ListInput
                    value={metaDataProperties}
                    onChange={propertiesItemInput => setMetadataProperties(propertiesItemInput)}
                    defaultValue={{key: '', value: '', public: true}}>
                    {({value, onChange}) => (
                      <div style={{display: 'flex', flexDirection: 'row'}}>
                        <Input
                          placeholder={t('articleEditor.panels.key')}
                          style={{
                            width: '40%',
                            marginRight: '10px'
                          }}
                          value={value.key}
                          onChange={propertyKey => onChange({...value, key: propertyKey})}
                        />
                        <Input
                          placeholder={t('articleEditor.panels.value')}
                          style={{
                            width: '60%'
                          }}
                          value={value.value}
                          onChange={propertyValue => onChange({...value, value: propertyValue})}
                        />
                        <Form.Group
                          style={{paddingTop: '6px', paddingLeft: '8px'}}
                          controlId="articleProperty">
                          <Toggle
                            style={{maxWidth: '70px', minWidth: '70px'}}
                            checkedChildren={t('articleEditor.panels.public')}
                            unCheckedChildren={t('articleEditor.panels.private')}
                            checked={value.public}
                            onChange={isPublic => onChange({...value, public: isPublic})}
                          />
                        </Form.Group>
                      </div>
                    )}
                  </ListInput>
                </Form.Group>
              </>
            )}
          </Form>
        </Panel>

        <ChooseEditImage
          image={image}
          disabled={false}
          openChooseModalOpen={() => setChooseModalOpen(true)}
          openEditModalOpen={() => setEditModalOpen(true)}
          removeImage={() => setImage(undefined)}
        />
      </Drawer.Body>

      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            setImage(value)
          }}
        />
      </Drawer>
      {image && (
        <Drawer open={isEditModalOpen} size="sm" onClose={() => setEditModalOpen(false)}>
          <ImageEditPanel id={image!.id} onClose={() => setEditModalOpen(false)} />
        </Drawer>
      )}
    </>
  )
}

export function previewForTeaser(teaser: Teaser, t: TFunction<'translation'>) {
  let type: string
  let imageURL: string | undefined
  let contentUrl: string | undefined
  let preTitle: string | undefined
  let title: string | undefined
  let lead: string | undefined

  switch (teaser.type) {
    case TeaserType.Article:
      type = 'Article'
      imageURL = teaser.article.latest.image?.previewURL ?? undefined
      preTitle = teaser.article.latest.preTitle ?? undefined
      title = teaser.article.latest.title ?? undefined
      lead = teaser.article.latest.lead ?? undefined
      break

    case TeaserType.PeerArticle:
      type = 'Peer Article'
      imageURL = teaser.article?.latest.image?.previewURL ?? undefined
      preTitle = teaser.article?.latest.preTitle ?? undefined
      title = teaser.article?.latest.title ?? undefined
      lead = teaser.article?.latest.lead ?? undefined
      break

    case TeaserType.Page:
      type = 'Page'
      imageURL = teaser.page.latest.image?.previewURL ?? undefined
      title = teaser.page.latest.title
      lead = teaser.page.latest.description ?? undefined
      break

    case TeaserType.Custom:
      type = 'Custom'
      imageURL = teaser.image?.previewURL ?? undefined
      title = teaser.title
      lead = teaser.lead ?? undefined
      preTitle = teaser.preTitle ?? undefined
      contentUrl = teaser.contentUrl
      break
  }

  return (
    <Panel>
      <Panel
        bordered
        style={{
          height: '200px',
          backgroundSize: 'cover',
          backgroundImage: `url(${imageURL ?? 'https://via.placeholder.com/240x240'})`,
          marginBottom: '12px'
        }}
      />
      <DescriptionList>
        {contentUrl && (
          <DescriptionListItem label={t('articleEditor.panels.contentUrl')}>
            {contentUrl}
          </DescriptionListItem>
        )}
        <DescriptionListItem label={t('articleEditor.panels.type')}>
          {type || '-'}
        </DescriptionListItem>
        <DescriptionListItem label={t('articleEditor.panels.preTitle')}>
          {preTitle || '-'}
        </DescriptionListItem>
        <DescriptionListItem label={t('articleEditor.panels.title')}>
          {title || '-'}
        </DescriptionListItem>
        <DescriptionListItem label={t('articleEditor.panels.lead')}>
          {lead || '-'}
        </DescriptionListItem>
      </DescriptionList>
    </Panel>
  )
}
