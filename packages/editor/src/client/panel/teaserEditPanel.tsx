import React, {useState} from 'react'

import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Panel,
  Radio,
  RadioGroup
} from 'rsuite'

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
      </Drawer.Header>

      <Drawer.Body>
        {previewForTeaser(initialTeaser)}
        <Panel header={t('articleEditor.panels.displayOptions')}>
          <Form fluid>
            <FormGroup>
              <ControlLabel>{t('articleEditor.panels.style')}</ControlLabel>
              <RadioGroup inline value={style} onChange={teaserStyle => setStyle(teaserStyle)}>
                <Radio value={TeaserStyle.Default}>Default</Radio>
                <Radio value={TeaserStyle.Light}>Light</Radio>
                <Radio value={TeaserStyle.Text}>text</Radio>
              </RadioGroup>
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('articleEditor.panels.preTitle')}</ControlLabel>
              <FormControl value={preTitle} onChange={preTitle => setPreTitle(preTitle)} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('articleEditor.panels.title')}</ControlLabel>
              <FormControl value={title} onChange={title => setTitle(title)} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('articleEditor.panels.lead')}</ControlLabel>
              <FormControl value={lead} onChange={lead => setLead(lead)} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('articleEditor.panels.lead')}</ControlLabel>
              <FormControl value={lead} onChange={lead => setLead(lead)} />
            </FormGroup>
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

      <Drawer.Footer>
        <Button
          appearance={'primary'}
          onClick={() =>
            onConfirm({
              ...initialTeaser,
              style,
              preTitle: preTitle || undefined,
              title: title || undefined,
              lead: lead || undefined,
              image
            })
          }>
          {t('articleEditor.panels.confirm')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {closeLabel}
        </Button>
      </Drawer.Footer>

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            setImage(value)
          }}
        />
      </Drawer>
      {image && (
        <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
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
        bordered={true}
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
