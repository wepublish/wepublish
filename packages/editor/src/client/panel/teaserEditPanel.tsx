import React, {useState} from 'react'

import {Button, Drawer, Form, Panel, Radio, RadioGroup} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {Teaser, TeaserType} from '../blocks/types'
import {TeaserStyle} from '../api'
import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

import {useTranslation} from 'react-i18next'
import {ChooseEditImage} from '../atoms/chooseEditImage'

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
  const [preTitle, setPreTitle] = useState(initialTeaser.preTitle)
  const [title, setTitle] = useState(initialTeaser.title)
  const [lead, setLead] = useState(initialTeaser.lead)

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
                image
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
        {previewForTeaser(initialTeaser)}
        <Panel header={t('articleEditor.panels.displayOptions')}>
          <Form fluid>
            <Form.Group>
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
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.preTitle')}</Form.ControlLabel>
              <Form.Control
                name="pre-title"
                value={preTitle}
                onChange={(preTitle: string) => setPreTitle(preTitle)}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.title')}</Form.ControlLabel>
              <Form.Control
                name="title"
                value={title}
                onChange={(title: string) => setTitle(title)}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('articleEditor.panels.lead')}</Form.ControlLabel>
              <Form.Control name="lead" value={lead} onChange={(lead: string) => setLead(lead)} />
            </Form.Group>
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

      <Drawer open={isChooseModalOpen} size={'sm'} onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            setImage(value)
          }}
        />
      </Drawer>
      {image && (
        <Drawer open={isEditModalOpen} size={'sm'} onClose={() => setEditModalOpen(false)}>
          <ImagedEditPanel id={image!.id} onClose={() => setEditModalOpen(false)} />
        </Drawer>
      )}
    </>
  )
}

function previewForTeaser(teaser: Teaser) {
  let type: string
  let imageURL: string | undefined
  let preTitle: string | undefined
  let title: string | undefined
  let lead: string | undefined

  const {t} = useTranslation()

  switch (teaser.type) {
    case TeaserType.Article:
      type = 'Article'
      imageURL = teaser.article.latest.image?.previewURL ?? undefined
      preTitle = teaser.article.latest.preTitle ?? undefined
      title = teaser.article.latest.title
      lead = teaser.article.latest.lead ?? undefined
      break

    case TeaserType.PeerArticle:
      type = 'Peer Article'
      imageURL = teaser.article?.latest.image?.previewURL ?? undefined
      preTitle = teaser.article?.latest.preTitle ?? undefined
      title = teaser.article?.latest.title
      lead = teaser.article?.latest.lead ?? undefined
      break

    case TeaserType.Page:
      type = 'Page'
      imageURL = teaser.page.latest.image?.previewURL ?? undefined
      title = teaser.page.latest.title
      lead = teaser.page.latest.description ?? undefined
      break
  }

  return (
    <Panel>
      <Panel
        bordered
        style={{
          height: '200px',
          backgroundSize: 'cover',
          backgroundImage: `url(${imageURL ?? 'https://via.placeholder.com/240x240'})`
        }}></Panel>
      <DescriptionList>
        <DescriptionListItem label={t('articleEditor.panels.type')}>{type}</DescriptionListItem>
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
