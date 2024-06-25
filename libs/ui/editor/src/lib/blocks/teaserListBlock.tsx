import {useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdEdit} from 'react-icons/md'
import {Drawer, IconButton as RSIconButton, Panel} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {TeaserListBlockValue} from './types'
import styled from '@emotion/styled'
import {ContentForTeaser} from './teaserGridBlock'
import {TeaserListConfigPanel, useTeaserTypeText} from '../panel/teaserListConfigPanel'
import {TypographicTextArea} from '../atoms'

const TeaserListBlockWrapper = styled.div`
  display: grid;
  gap: 8px;
`

const TeaserGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 16px;
`

const TeaserWrapper = styled('article')`
  position: relative;
  min-height: 250px;
  background-color: #f7f9fa;
`

const PreviewPanel = styled(Panel)`
  overflow: hidden;
  background-color: #f7f9fa;
  display: grid;
  position: relative;
`

const Count = styled.p`
  text-align: center;
`

const IconButton = styled(RSIconButton)`
  position: absolute;
  right: 0;
`

const InfoList = styled.ul`
  list-style: none;
  padding: 12px;
`

export const TeaserListBlock = ({value, onChange, autofocus}: BlockProps<TeaserListBlockValue>) => {
  const focusRef = useRef<HTMLTextAreaElement>(null)
  const {filter, teasers, skip, take, teaserType} = value
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const {t} = useTranslation()
  const teaserTypeText = useTeaserTypeText()

  const isEmpty = !teasers.length || !value.title
  const teasersToDisplay = teasers.slice(0, 6)

  useEffect(() => {
    if (autofocus && isEmpty) {
      focusRef.current?.focus()
    }
  }, [autofocus, isEmpty])

  return (
    <TeaserListBlockWrapper>
      <TypographicTextArea
        ref={focusRef}
        variant="title"
        align="center"
        placeholder={t('blocks.title.title')}
        value={value.title ?? ''}
        onChange={e => onChange({...value, title: e.target.value})}
      />

      <PreviewPanel bodyFill bordered>
        <PlaceholderInput onAddClick={() => setIsDialogOpen(true)}>
          <IconButton size={'lg'} icon={<MdEdit />} onClick={() => setIsDialogOpen(true)}>
            {t('blocks.teaserList.edit')}
          </IconButton>

          <InfoList>
            <li>{t('blocks.teaserList.teaserType', {teaserType: teaserTypeText(teaserType)})}</li>
            <li>{t('blocks.teaserList.take', {take})}</li>
            <li>{t('blocks.teaserList.skip', {skip})}</li>
            {!!filter.tags?.length && (
              <li>{t('blocks.teaserList.tags', {tags: filter.tags.join(', ')})}</li>
            )}
          </InfoList>
        </PlaceholderInput>
      </PreviewPanel>

      <Count>
        {t('blocks.teaserList.teasers', {
          count: teasers.length ? teasers.length : 0
        })}
      </Count>

      {!!teasersToDisplay.length && (
        <TeaserGrid>
          {teasersToDisplay.map(([, teaser]) => (
            <TeaserWrapper>{ContentForTeaser(teaser)}</TeaserWrapper>
          ))}
        </TeaserGrid>
      )}

      <Drawer size="lg" open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <TeaserListConfigPanel
          value={value}
          onClose={() => setIsDialogOpen(false)}
          onSelect={value => {
            setIsDialogOpen(false)
            onChange(value)
          }}
        />
      </Drawer>
    </TeaserListBlockWrapper>
  )
}
