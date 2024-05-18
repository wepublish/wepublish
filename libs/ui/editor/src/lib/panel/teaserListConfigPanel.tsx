import {TagType, TeaserType} from '@wepublish/editor/api'
import {useEffect, useMemo, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Drawer, Form, Schema, SelectPicker} from 'rsuite'

import {SelectTags} from '../atoms/tag/selectTags'
import {TeaserListBlockValue} from '../blocks/types'
import styled from '@emotion/styled'
import {css} from '@emotion/react'

const DrawerBody = styled(Drawer.Body)`
  padding: 24px;
`

const inputStyles = css`
  width: 200px !important;
`

export type TeaserListConfigPanelProps = {
  value: TeaserListBlockValue
  onClose(): void
  onSelect(newValue: TeaserListBlockValue): void
}

export const useTeaserTypeText = () => {
  const {t} = useTranslation()

  return (tagType: TeaserType) => t(`resources.teaserType.${tagType}`)
}

export function TeaserListConfigPanel({value, onClose, onSelect}: TeaserListConfigPanelProps) {
  const [tagFilter, setTagFilter] = useState(value.filter.tags ?? [])
  const [take, setTake] = useState(value.take)
  const [skip, setSkip] = useState(value.skip)
  const [teaserType, setTeaserType] = useState(value.teaserType)
  const {t} = useTranslation()
  const teaserTypeText = useTeaserTypeText()

  const {NumberType, StringType} = Schema.Types
  const validationModel = Schema.Model({
    skip: NumberType().min(0).isRequired(),
    take: NumberType().min(0).max(100).isRequired(),
    teaserType: StringType()
      .isOneOf([TeaserType.Article, TeaserType.Page, TeaserType.Event])
      .isRequired()
  })

  const tagType = useMemo(() => {
    switch (teaserType) {
      case TeaserType.Article:
        return TagType.Article
      case TeaserType.Page:
        return TagType.Page
      case TeaserType.Event:
        return TagType.Event
    }

    throw new Error('Somehow unsupported teaser was selected')
  }, [teaserType])

  useEffect(() => {
    setTagFilter([])
  }, [teaserType])

  return (
    <Form
      formValue={{tagFilter, skip, take, teaserType}}
      model={validationModel}
      onSubmit={validationPassed =>
        validationPassed &&
        onSelect({
          ...value,
          filter: {tags: tagFilter},
          skip,
          take,
          teaserType
        })
      }>
      <Drawer.Header>
        <Drawer.Title>{t('blocks.teaserList.edit')}</Drawer.Title>

        <Drawer.Actions>
          <Button appearance={'ghost'} onClick={() => onClose()} type="button">
            {t('close')}
          </Button>

          <Button appearance={'primary'} type="submit">
            {t('saveAndClose')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <DrawerBody>
        <Form.Group controlId="teaserType">
          <Form.ControlLabel>{t('blocks.teaserList.teaserTypeLabel')}</Form.ControlLabel>

          <SelectPicker
            name="teaserType"
            cleanable={false}
            value={teaserType}
            onChange={value => setTeaserType(value!)}
            data={[
              {label: teaserTypeText(TeaserType.Article), value: TeaserType.Article},
              {label: teaserTypeText(TeaserType.Event), value: TeaserType.Event},
              {label: teaserTypeText(TeaserType.Page), value: TeaserType.Page}
            ]}
            css={inputStyles}
          />
        </Form.Group>

        <Form.Group controlId="skip">
          <Form.ControlLabel>{t('blocks.teaserList.skipLabel')}</Form.ControlLabel>

          <Form.Control
            name="skip"
            type="number"
            value={skip}
            onChange={s => setSkip(+s)}
            css={inputStyles}
          />
        </Form.Group>

        <Form.Group controlId="take">
          <Form.ControlLabel>{t('blocks.teaserList.takeLabel')}</Form.ControlLabel>

          <Form.Control
            name="take"
            type="number"
            value={take}
            onChange={t => setTake(+t)}
            css={inputStyles}
          />
        </Form.Group>

        <Form.Group controlId="tags">
          <Form.ControlLabel>{t('blocks.teaserList.tagsLabel')}</Form.ControlLabel>

          <SelectTags
            name="tags"
            tagType={tagType}
            setSelectedTags={setTagFilter}
            selectedTags={tagFilter}
            css={inputStyles}
          />
        </Form.Group>
      </DrawerBody>
    </Form>
  )
}
