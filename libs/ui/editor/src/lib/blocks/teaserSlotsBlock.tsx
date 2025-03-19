import styled from '@emotion/styled'
import {
  ImageRefFragment,
  PeerWithProfileFragment,
  TeaserSlotsAutofillConfigInput,
  TeaserSlotType,
  TeaserStyle,
  TeaserType,
  useArticleListQuery
} from '@wepublish/editor/api'
import arrayMove from 'array-move'
import {ReactNode, useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdArticle, MdDelete, MdEdit} from 'react-icons/md'
import {SortableContainer, SortableElement, SortEnd} from 'react-sortable-hoc'
import {Avatar, Button, Drawer, IconButton as RIconButton, Panel as RPanel, Toggle} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {Overlay} from '../atoms/overlay'
import {PlaceholderImage} from '../atoms/placeholderImage'
import {PlaceholderInput} from '../atoms/placeholderInput'
import {Typography} from '../atoms/typography'
import {TeaserEditPanel} from '../panel/teaserEditPanel'
import {TeaserSelectAndEditPanel} from '../panel/teaserSelectAndEditPanel'
import {ArticleTeaser, Teaser as TeaserTypeMixed, TeaserSlotsBlockValue} from './types'
import {TeaserSlotsAutofillControls} from './teaserSlots/teaser-slots-autofill-controls'
import {AdTeaser, AdTeaserWrapper} from '@wepublish/ui/editor'

const IconButton = styled(RIconButton)`
  padding: 5px !important;
`

const SortableContainerComponent = styled.div<{numColumns: number}>`
  display: grid;
  grid-template-columns: repeat(${({numColumns}) => `${numColumns}`}, 1fr);
  grid-gap: 20px;
  user-select: none;

  img {
    user-drag: none;
  }
`

const Panel = styled(RPanel, {
  shouldForwardProp: prop => prop !== 'showGrabCursor'
})<{showGrabCursor: boolean}>`
  display: grid;
  cursor: ${({showGrabCursor}) => showGrabCursor && 'grab'};
  height: 300px;
  overflow: hidden;
  z-index: 1;
`

const Teaser = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

const TeaserWrapper = styled('div', {
  shouldForwardProp: prop => prop !== 'autofill'
})<{autofill: boolean}>`
  width: 100%;
  height: 100%;
  opacity: ${({autofill}) => (autofill ? 0.4 : 1)};
`

const TeaserContentWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
`

const TeaserImage = styled.img`
  min-width: 100%;
  min-height: 100%;
`

export const TeaserToolbar = styled.div`
  position: absolute;
  z-index: 2000;
  right: 4px;
  bottom: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
  background-color: #fff;
  padding: 5px;
  border-radius: 3px;
  font-size: 0.875rem;
`
export const SlotToolbar = styled.div`
  position: absolute;
  z-index: 2000;
  right: 4px;
  top: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
  background-color: #fff;
  padding: 5px;
  border-radius: 3px;
  font-size: 0.875rem;
`

const PeerInfo = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Content = styled.div`
  margin-bottom: 10px;
`

const PeerLogo = styled.div`
  display: flex;
  margin-bottom: 10px;
`

const TeaserInfoWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const TeaserStyleElement = styled.div`
  flex-shrink: 0;
  margin-right: 10px;
`

const Status = styled.div`
  flex-shrink: 0;
`

const GridItem = SortableElement<TeaserBlockProps>((props: TeaserBlockProps) => {
  return <TeaserBlock {...props} />
})

const TeaserSlotsControls = styled.div`
  margin-top: 20px;
`

interface GridProps {
  numColumns: number
  children?: ReactNode
}

export const TeaserSlotsBlockWrapper = styled.div``

const Grid = SortableContainer<GridProps>(({children, numColumns}: GridProps) => {
  return <SortableContainerComponent numColumns={numColumns}>{children}</SortableContainerComponent>
})

export function TeaserSlotsBlock({value, onChange}: BlockProps<TeaserSlotsBlockValue>) {
  const [editIndex, setEditIndex] = useState(0)

  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const {numColumns, autofillConfig, slots, ...rest} = value

  const {data: articleList, refetch} = useArticleListQuery({
    variables: {
      take: 0
    }
  })

  function handleTeaserLinkChange(index: number, teaser: TeaserTypeMixed | null) {
    onChange({
      ...rest,
      autofillConfig,
      numColumns,
      slots: Object.assign([], slots, {
        [index]: {...slots[index], teaser}
      })
    })
  }

  function handleSlotTypeChange(index: number, type: TeaserSlotType) {
    onChange({
      ...rest,
      autofillConfig,
      numColumns,
      slots: Object.assign([], slots, {
        [index]: {...slots[index], type}
      })
    })
  }

  function handleSlotDelete(index: number) {
    const newSlots = [...slots]
    newSlots.splice(index, 1)
    onChange({
      ...rest,
      autofillConfig,
      numColumns,
      slots: newSlots
    })
  }

  function handleAddSlot() {
    onChange({
      ...rest,
      autofillConfig,
      numColumns,
      slots: [
        ...slots,
        {
          type: autofillConfig.enabled ? TeaserSlotType.Autofill : TeaserSlotType.Manual,
          teaser: null
        }
      ]
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
      ...rest,
      autofillConfig,
      numColumns,
      slots: arrayMove(slots, oldIndex, newIndex)
    })
  }

  function handleAutofillConfigChange(newAutofillConfig: TeaserSlotsAutofillConfigInput) {
    let newSlots = slots
    if (!autofillConfig.enabled && newAutofillConfig.enabled) {
      newSlots = [
        ...slots.map(slot => (!slot?.teaser ? {type: TeaserSlotType.Autofill, teaser: null} : slot))
      ]
    }
    if (autofillConfig.enabled && !newAutofillConfig.enabled) {
      newSlots = [
        ...slots.map(slot =>
          slot.type === TeaserSlotType.Autofill
            ? {
                type: TeaserSlotType.Manual,
                teaser: null
              }
            : slot
        )
      ]
    }

    onChange({
      ...rest,
      slots: newSlots,
      autofillConfig: newAutofillConfig,
      numColumns
    })
  }

  const articleTeasers = articleList?.articles.nodes.map(
    article =>
      ({
        article,
        articleID: article.id,
        style: TeaserStyle.Default,
        type: TeaserType.Article,
        imageID: undefined,
        lead: undefined,
        title: undefined
      } as ArticleTeaser)
  )

  const autofillSlotsCount = useMemo(
    () => slots.filter(slot => slot.type === TeaserSlotType.Autofill).length,
    [slots]
  )

  useEffect(() => {
    const {skip, tags} = autofillConfig
    refetch({
      skip: skip ?? 0,
      take: autofillSlotsCount,
      filter: {tags: tags ?? []}
    })
  }, [autofillConfig, autofillSlotsCount, refetch])

  return (
    <TeaserSlotsBlockWrapper>
      <TeaserSlotsAutofillControls
        config={autofillConfig}
        onConfigChange={handleAutofillConfigChange}
        loadedTeasers={articleTeasers?.length ?? 0}
        autofillSlots={autofillSlotsCount}
      />
      <Grid
        numColumns={numColumns}
        axis="xy"
        distance={10}
        onSortStart={handleSortStart}
        onSortEnd={handleSortEnd}>
        {slots.map(({type, teaser: manualTeaser}, index) => {
          const teaser = type === TeaserSlotType.Manual ? manualTeaser : articleTeasers?.shift()
          return (
            <GridItem
              key={index}
              index={index}
              teaser={teaser}
              numColumns={numColumns}
              showGrabCursor={slots.length !== 1}
              disabled={slots.length === 1}
              onEdit={() => {
                setEditIndex(index)
                setEditModalOpen(true)
              }}
              onDelete={() => {
                handleSlotDelete(index)
              }}
              onChoose={() => {
                setEditIndex(index)
                setChooseModalOpen(true)
              }}
              onRemove={() => {
                handleTeaserLinkChange(index, null)
              }}
              slotType={type}
              onSlotTypeChange={type => handleSlotTypeChange(index, type)}
              autofillEnabled={autofillConfig.enabled}
            />
          )
        })}
      </Grid>
      <TeaserSlotsControls>
        <Button onClick={handleAddSlot}>Add slot</Button>
      </TeaserSlotsControls>
      <Drawer open={isEditModalOpen} size="sm" onClose={() => setEditModalOpen(false)}>
        {slots[editIndex] && (
          <TeaserEditPanel
            initialTeaser={slots[editIndex].teaser!}
            onClose={() => setEditModalOpen(false)}
            onConfirm={teaser => {
              setEditModalOpen(false)
              handleTeaserLinkChange(editIndex, teaser)
            }}
          />
        )}
      </Drawer>
      <Drawer open={isChooseModalOpen} size="md" onClose={() => setChooseModalOpen(false)}>
        <TeaserSelectAndEditPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={teaser => {
            setChooseModalOpen(false)
            handleTeaserLinkChange(editIndex, teaser)
          }}
        />
      </Drawer>
    </TeaserSlotsBlockWrapper>
  )
}

export interface TeaserBlockProps {
  teaser?: TeaserTypeMixed | null
  showGrabCursor: boolean
  numColumns: number
  onEdit: () => void
  onDelete: () => void
  onChoose: () => void
  onRemove: () => void
  onSlotTypeChange: (slotType: TeaserSlotType) => void
  slotType: TeaserSlotType
  autofillEnabled: boolean
}

export function TeaserBlock({
  teaser,
  numColumns,
  showGrabCursor,
  onEdit,
  onChoose,
  onDelete,
  onRemove,
  onSlotTypeChange,
  slotType,
  autofillEnabled
}: TeaserBlockProps) {
  const {t} = useTranslation()

  const manualOverride = slotType === TeaserSlotType.Manual
  const toggleSlotType = () =>
    onSlotTypeChange(manualOverride ? TeaserSlotType.Autofill : TeaserSlotType.Manual)

  return (
    <Panel bodyFill showGrabCursor={showGrabCursor}>
      <Teaser>
        <TeaserWrapper autofill={!manualOverride}>
          {manualOverride && !teaser && <PlaceholderInput onAddClick={onChoose} />}
          {/*{!manualOverride && <span>Autofilled</span>}*/}
          {teaser && <ContentForTeaser teaser={teaser} numColumns={numColumns} />}
        </TeaserWrapper>
        <TeaserToolbar>
          {manualOverride && teaser && (
            <>
              <IconButtonTooltip caption={t('blocks.flexTeaser.chooseTeaser')}>
                <IconButton icon={<MdArticle />} onClick={onChoose} appearance={'subtle'} />
              </IconButtonTooltip>
              {teaser.type !== TeaserType.Advertisement &&
              (teaser.type !== TeaserType.PeerArticle || !teaser?.peer?.isDisabled) ? (
                <IconButtonTooltip caption={t('blocks.flexTeaser.editTeaser')}>
                  <IconButton icon={<MdEdit />} onClick={onEdit} appearance={'subtle'} />
                </IconButtonTooltip>
              ) : null}
              <IconButtonTooltip caption={t('blocks.flexTeaser.deleteTeaser')}>
                <IconButton icon={<MdDelete />} onClick={onRemove} appearance={'subtle'} />
              </IconButtonTooltip>
            </>
          )}
          {autofillEnabled && (
            <>
              <span>{manualOverride ? 'Manual' : 'Auto'}</span>
              <Toggle onClick={toggleSlotType} checked={manualOverride} />
            </>
          )}
        </TeaserToolbar>

        <SlotToolbar>
          <IconButtonTooltip caption={t('blocks.flexTeaser.deleteTeaser')}>
            <IconButton icon={<MdDelete />} onClick={onDelete} appearance={'subtle'} />
          </IconButtonTooltip>
        </SlotToolbar>
      </Teaser>
    </Panel>
  )
}

type ContentForTeaserProps = {
  teaser: TeaserTypeMixed
  numColumns?: number
}

export function ContentForTeaser({teaser, numColumns}: ContentForTeaserProps) {
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
          title={teaser.title ?? teaser.article?.latest.title ?? undefined}
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
          title={teaser.title ?? teaser.page.latest.title ?? ''}
          lead={teaser.lead ?? teaser.page.latest.description ?? undefined}
          states={states}
          numColumns={numColumns}
        />
      )
    }

    case TeaserType.Event: {
      return (
        <TeaserContent
          style={teaser.style}
          image={teaser.image ?? teaser.event.image ?? undefined}
          title={teaser.title ?? teaser.event.name ?? ''}
          lead={teaser.lead || teaser.event.lead || teaser.event.location || undefined}
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

    case TeaserType.Advertisement: {
      return (
        <AdTeaserWrapper style={{height: '100%'}}>
          <AdTeaser style={{width: `100%`, height: `100%`}}>
            Advertisement
            <br />
            zone={teaser.zoneId}
          </AdTeaser>
        </AdTeaserWrapper>
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

const OverlayComponent = styled(Overlay)<{isDisabled?: boolean}>`
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
      <TeaserContentWrapper>
        {image ? (
          <TeaserImage src={numColumns === 1 ? image.column1URL ?? '' : image.column6URL ?? ''} />
        ) : (
          <PlaceholderImage />
        )}
      </TeaserContentWrapper>

      <OverlayComponent isDisabled={peer?.isDisabled || false}>
        {peer && peer.isDisabled === true ? (
          <PeerInfo>
            <Typography variant="body2" color="white" spacing="small" align="center">
              {t('articleEditor.panels.peerDisabled')}
            </Typography>
          </PeerInfo>
        ) : (
          <>
            <Content>
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
            </Content>
            {peer && (
              <PeerLogo>
                <Avatar src={peer.profile?.logo?.squareURL ?? undefined} circle />
              </PeerLogo>
            )}
            <TeaserInfoWrapper>
              <TeaserStyleElement>
                <Typography variant="subtitle1" color="gray">
                  {t('articleEditor.panels.teaserStyle', {label})}
                </Typography>
              </TeaserStyleElement>
              <Status>
                <Typography variant="subtitle1" color="gray">
                  {t('articleEditor.panels.status', {stateJoin})}
                </Typography>
              </Status>
            </TeaserInfoWrapper>
          </>
        )}
      </OverlayComponent>
    </>
  )
}
