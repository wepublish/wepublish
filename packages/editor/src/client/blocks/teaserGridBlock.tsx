import styled from '@emotion/styled'
import arrayMove from 'array-move'
import nanoid from 'nanoid'
import React, {ReactNode, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdArticle, MdDelete, MdEdit} from 'react-icons/md'
import {SortableContainer, SortableElement, SortEnd} from 'react-sortable-hoc'
import {Avatar, Drawer, IconButton, Panel} from 'rsuite'

import {ImageRefFragment, PeerWithProfileFragment, TeaserStyle} from '../api'
import {BlockProps} from '../atoms/blockList'
import {Overlay} from '../atoms/overlay'
import {PlaceholderImage} from '../atoms/placeholderImage'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {Typography} from '../atoms/typography'
import {TeaserEditPanel} from '../panel/teaserEditPanel'
import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'
import {Teaser, TeaserGridBlockValue, TeaserType} from './types'

export const StyledIconButton = styled(IconButton)`
  margin: 10px;
`

const StyledSortableContainer = styled.div<{numColumns: number}>`
  display: grid;
  grid-template-columns: repeat(${({numColumns}) => `${numColumns}`}, 1fr);
  grid-gap: 20px;
  user-select: none;
`

export const StyledPanel = styled(Panel)<{showGrabCursor: boolean}>`
  cursor: ${({showGrabCursor}) => showGrabCursor && 'grab'};
  height: 300px;
  overflow: hidden;
  z-index: 1;
`

export const StyledTeaser = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`
const StyledTeaserContent = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
`

const StyledTeaserImage = styled.img`
  width: 100%;
  height: 100%;
`

export const StyledIconWrapper = styled.div`
  position: absolute;
  z-index: 1;
  right: 0;
  top: 0;
`

const StyledPeerInfo = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const StyledContent = styled.div`
  margin-bottom: 10px;
`

const StyledPeerLogo = styled.div`
  display: flex;
  margin-bottom: 10px;
`

const StyledTeaserInfoWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const StyledTeaserStyle = styled.div`
  flex-shrink: 0;
  margin-right: 10px;
`

const StyledStatus = styled.div`
  flex-shrink: 0;
`

const GridItem = SortableElement((props: TeaserBlockProps) => {
  return <TeaserBlock {...props} />
})

interface GridProps {
  numColumns: number
  children?: ReactNode
}

const Grid = SortableContainer(({children, numColumns}: GridProps) => {
  return <StyledSortableContainer numColumns={numColumns}>{children}</StyledSortableContainer>
})

export function TeaserGridBlock({value, onChange}: BlockProps<TeaserGridBlockValue>) {
  const [editIndex, setEditIndex] = useState(0)

  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)

  const {teasers, numColumns} = value

  function handleTeaserLinkChange(index: number, teaserLink: Teaser | null) {
    onChange({
      numColumns,
      teasers: Object.assign([], teasers, {
        [index]: [nanoid(), teaserLink || null]
      })
    })
  }

  function handleSortStart() {
    document.documentElement.style.cursor = 'grabbing'
    document.body.style.pointerEvents = 'none'
  }

  function handleSortEnd({oldIndex, newIndex}: SortEnd) {
    document.documentElement.style.cursor = ''
    document.body.style.pointerEvents = ''

    onChange({
      numColumns,
      teasers: arrayMove(teasers, oldIndex, newIndex)
    })
  }

  return (
    <>
      <Grid
        numColumns={numColumns}
        axis="xy"
        distance={10}
        onSortStart={handleSortStart}
        onSortEnd={handleSortEnd}>
        {teasers.map(([key, teaser], index) => (
          <GridItem
            key={key}
            index={index}
            teaser={teaser}
            numColumns={numColumns}
            showGrabCursor={teasers.length !== 1}
            disabled={teasers.length === 1}
            onEdit={() => {
              setEditIndex(index)
              setEditModalOpen(true)
            }}
            onChoose={() => {
              setEditIndex(index)
              setChooseModalOpen(true)
            }}
            onRemove={() => {
              handleTeaserLinkChange(index, null)
            }}
          />
        ))}
      </Grid>
      <Drawer open={isEditModalOpen} size="sm" onClose={() => setEditModalOpen(false)}>
        <TeaserEditPanel
          initialTeaser={teasers[editIndex][1]!}
          onClose={() => setEditModalOpen(false)}
          onConfirm={teaser => {
            setEditModalOpen(false)
            handleTeaserLinkChange(editIndex, teaser)
          }}
        />
      </Drawer>
      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <TeaserSelectAndEditPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={teaser => {
            setChooseModalOpen(false)
            handleTeaserLinkChange(editIndex, teaser)
          }}
        />
      </Drawer>
    </>
  )
}

export interface TeaserBlockProps {
  teaser: Teaser | null
  showGrabCursor: boolean
  numColumns: number
  onEdit: () => void
  onChoose: () => void
  onRemove: () => void
}

export function TeaserBlock({
  teaser,
  numColumns,
  showGrabCursor,
  onEdit,
  onChoose,
  onRemove
}: TeaserBlockProps) {
  return (
    <StyledPanel bodyFill showGrabCursor={showGrabCursor}>
      <PlaceholderInput onAddClick={onChoose}>
        {teaser && (
          <StyledTeaser>
            {contentForTeaser(teaser, numColumns)}

            <StyledIconWrapper>
              <StyledIconButton icon={<MdArticle />} onClick={onChoose} />
              {teaser.type !== TeaserType.PeerArticle || !teaser?.peer?.isDisabled ? (
                <StyledIconButton icon={<MdEdit />} onClick={onEdit} />
              ) : null}
              <StyledIconButton icon={<MdDelete />} onClick={onRemove} />
            </StyledIconWrapper>
          </StyledTeaser>
        )}
      </PlaceholderInput>
    </StyledPanel>
  )
}

export function contentForTeaser(teaser: Teaser, numColumns?: number) {
  const {t} = useTranslation()
  switch (teaser.type) {
    case TeaserType.Article: {
      const states = []

      if (teaser?.article?.draft) states.push(t('articleEditor.panels.stateDraft'))
      if (teaser?.article?.pending) states.push(t('articleEditor.panels.statePending'))
      if (teaser?.article?.published) states.push(t('articleEditor.panels.statePublished'))

      return (
        <TeaserContent
          style={teaser.style}
          image={teaser.image ?? teaser.article.latest.image ?? undefined}
          preTitle={teaser.preTitle ?? teaser.article.latest.preTitle ?? undefined}
          title={teaser.title ?? teaser.article.latest.title ?? ''}
          lead={teaser.lead ?? teaser.article.latest.lead ?? undefined}
          states={states}
          numColumns={numColumns}
        />
      )
    }

    case TeaserType.PeerArticle: {
      const states = []

      if (teaser?.article?.draft) states.push(t('articleEditor.panels.stateDraft'))
      if (teaser?.article?.pending) states.push(t('articleEditor.panels.statePending'))
      if (teaser?.article?.published) states.push(t('articleEditor.panels.statePublished'))

      return (
        <TeaserContent
          style={teaser.style}
          image={teaser.image ?? teaser.article?.latest.image ?? undefined}
          preTitle={teaser.preTitle ?? teaser.article?.latest.preTitle ?? undefined}
          title={teaser.title ?? teaser.article?.latest.title ?? ''}
          lead={teaser.lead ?? teaser.article?.latest.lead ?? undefined}
          states={states}
          peer={teaser.peer}
          numColumns={numColumns}
        />
      )
    }

    case TeaserType.Page: {
      const states = []

      if (teaser?.page?.draft) states.push(t('articleEditor.panels.stateDraft'))
      if (teaser?.page?.pending) states.push(t('articleEditor.panels.statePending'))
      if (teaser?.page?.published) states.push(t('articleEditor.panels.statePublished'))

      return (
        <TeaserContent
          style={teaser.style}
          image={teaser.image ?? teaser.page.latest.image ?? undefined}
          title={teaser.title ?? teaser.page.latest.title}
          lead={teaser.lead ?? teaser.page.latest.description ?? undefined}
          states={states}
          numColumns={numColumns}
        />
      )
    }

    case TeaserType.Custom: {
      return (
        <TeaserContent
          style={teaser.style}
          contentUrl={teaser.contentUrl}
          image={teaser.image ?? undefined}
          title={teaser.title}
          lead={teaser.lead ?? undefined}
          numColumns={numColumns}
        />
      )
    }

    default:
      return null
  }
}

export interface TeaserContentProps {
  style: TeaserStyle
  preTitle?: string
  title?: string
  lead?: string
  image?: ImageRefFragment
  states?: string[]
  peer?: PeerWithProfileFragment
  numColumns?: number
  contentUrl?: string
}

function labelForTeaserStyle(style: TeaserStyle) {
  switch (style) {
    case TeaserStyle.Default:
      return 'Default'

    case TeaserStyle.Light:
      return 'Light'

    case TeaserStyle.Text:
      return 'Text'
  }
}

const StyledOverlay = styled(Overlay)<{isDisabled?: boolean}>`
  bottom: 0;
  width: 100%;
  padding: 10px;
  height: ${({isDisabled}) => (isDisabled ? '100%' : 'auto')};
`

export function TeaserContent({
  style,
  preTitle,
  contentUrl,
  title,
  lead,
  image,
  states,
  peer,
  numColumns
}: TeaserContentProps) {
  const label = labelForTeaserStyle(style)
  const {t} = useTranslation()
  const stateJoin = states?.join(' / ')
  return (
    <>
      <StyledTeaserContent>
        {image ? (
          <StyledTeaserImage
            src={numColumns === 1 ? image.column1URL ?? '' : image.column6URL ?? ''}
          />
        ) : (
          <PlaceholderImage />
        )}
      </StyledTeaserContent>

      <StyledOverlay isDisabled={peer?.isDisabled || false}>
        {peer && peer.isDisabled === true ? (
          <StyledPeerInfo>
            <Typography variant="body2" color="white" spacing="small" align="center">
              {t('articleEditor.panels.peerDisabled')}
            </Typography>
          </StyledPeerInfo>
        ) : (
          <>
            <StyledContent>
              {contentUrl && <div>{contentUrl}</div>}
              {preTitle && (
                <Typography variant="subtitle1" color="white" spacing="small" ellipsize>
                  {preTitle}
                </Typography>
              )}
              <Typography variant="body2" color="white" spacing="small">
                {title || t('articleEditor.panels.untitled')}
              </Typography>
              {lead && (
                <Typography variant="subtitle1" color="white" ellipsize>
                  {lead}
                </Typography>
              )}
            </StyledContent>
            {peer && (
              <StyledPeerLogo>
                <Avatar src={peer.profile?.logo?.squareURL ?? undefined} circle />
              </StyledPeerLogo>
            )}
            <StyledTeaserInfoWrapper>
              <StyledTeaserStyle>
                <Typography variant="subtitle1" color="gray">
                  {t('articleEditor.panels.teaserStyle', {label})}
                </Typography>
              </StyledTeaserStyle>
              <StyledStatus>
                <Typography variant="subtitle1" color="gray">
                  {t('articleEditor.panels.status', {stateJoin})}
                </Typography>
              </StyledStatus>
            </StyledTeaserInfoWrapper>
          </>
        )}
      </StyledOverlay>
    </>
  )
}
