import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from '@emotion/styled';
import { FullImageFragment, TeaserType } from '@wepublish/editor/api';
import nanoid from 'nanoid';
import { ChangeEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArticle, MdDelete, MdEdit } from 'react-icons/md';
import { Drawer, IconButton as RIconButton, Panel as RPanel } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { Overlay } from '../atoms/overlay';
import { PlaceholderImage } from '../atoms/placeholderImage';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { Typography } from '../atoms/typography';
import { TeaserEditPanel } from '../panel/teaserEditPanel';
import { TeaserSelectAndEditPanel } from '../panel/teaserSelectAndEditPanel';
import { Teaser as TeaserTypeMixed, TeaserGridBlockValue } from './types';

const IconButton = styled(RIconButton)`
  margin: 10px;
`;

const SortableContainerComponent = styled.div<{ numColumns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ numColumns }) => `${numColumns}`}, 1fr);
  grid-gap: 20px;
  user-select: none;
`;

const Panel = styled(RPanel, {
  shouldForwardProp: prop => prop !== 'showGrabCursor',
})<{ showGrabCursor: boolean }>`
  display: grid;
  cursor: ${({ showGrabCursor }) => showGrabCursor && 'grab'};
  height: 300px;
  overflow: hidden;
  z-index: 1;
`;

const Teaser = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;
const TeaserContentWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
`;

const TeaserImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const IconWrapper = styled.div`
  position: absolute;
  z-index: 1;
  right: 0;
  top: 0;
`;

const PeerInfo = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div`
  margin-bottom: 10px;
`;

const PeerLogo = styled.div`
  display: flex;
  margin-bottom: 10px;
`;

const TeaserInfoWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const TeaserStyleElement = styled.div`
  flex-shrink: 0;
  margin-right: 10px;
`;

const Status = styled.div`
  flex-shrink: 0;
`;

export interface SortableTeaserProps {
  id: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function SortableTeaser({
  id,
  disabled,
  children,
}: SortableTeaserProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
        cursor: isDragging ? 'grabbing' : undefined,
        position: 'relative',
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export function TeaserGridBlock({
  value,
  onChange,
}: BlockProps<TeaserGridBlockValue>) {
  const { t } = useTranslation();
  const [editIndex, setEditIndex] = useState(0);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);

  const { teasers, numColumns } = value;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  function handleTeaserLinkChange(
    index: number,
    teaserLink: TeaserTypeMixed | null
  ) {
    onChange({
      ...value,
      numColumns,
      teasers: Object.assign([], teasers, {
        [index]: [nanoid(), teaserLink || null],
      }),
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = teasers.findIndex(([key]) => key === active.id);
    const newIndex = teasers.findIndex(([key]) => key === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onChange({
      ...value,
      numColumns,
      teasers: arrayMove(teasers, oldIndex, newIndex),
    });
  }

  function handleTitleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange({
      ...value,
      title: e.target.value,
    });
  }

  return (
    <>
      <TypographicTextArea
        variant="title"
        align="center"
        placeholder={t('blocks.title.title')}
        value={value.title ?? ''}
        onChange={handleTitleChange}
      />
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={teasers.map(([key]) => key)}
          strategy={rectSortingStrategy}
        >
          <SortableContainerComponent numColumns={numColumns}>
            {teasers.map(([key, teaser], index) => (
              <SortableTeaser
                key={key}
                id={key}
                disabled={teasers.length === 1}
              >
                <TeaserBlock
                  teaser={teaser}
                  numColumns={numColumns}
                  showGrabCursor={teasers.length !== 1}
                  onEdit={() => {
                    setEditIndex(index);
                    setEditModalOpen(true);
                  }}
                  onChoose={() => {
                    setEditIndex(index);
                    setChooseModalOpen(true);
                  }}
                  onRemove={() => {
                    handleTeaserLinkChange(index, null);
                  }}
                />
              </SortableTeaser>
            ))}
          </SortableContainerComponent>
        </SortableContext>
      </DndContext>
      <Drawer
        open={isEditModalOpen}
        size="sm"
        onClose={() => setEditModalOpen(false)}
      >
        <TeaserEditPanel
          initialTeaser={teasers[editIndex][1]!}
          onClose={() => setEditModalOpen(false)}
          onConfirm={teaser => {
            setEditModalOpen(false);
            handleTeaserLinkChange(editIndex, teaser);
          }}
        />
      </Drawer>
      <Drawer
        open={isChooseModalOpen}
        size="sm"
        onClose={() => setChooseModalOpen(false)}
      >
        <TeaserSelectAndEditPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={teaser => {
            setChooseModalOpen(false);
            handleTeaserLinkChange(editIndex, teaser);
          }}
        />
      </Drawer>
    </>
  );
}

export interface TeaserBlockProps {
  teaser: TeaserTypeMixed | null;
  showGrabCursor: boolean;
  numColumns: number;
  onEdit: () => void;
  onChoose: () => void;
  onRemove: () => void;
}

export function TeaserBlock({
  teaser,
  numColumns,
  showGrabCursor,
  onEdit,
  onChoose,
  onRemove,
}: TeaserBlockProps) {
  const { t } = useTranslation();
  return (
    <Panel
      bodyFill
      showGrabCursor={showGrabCursor}
    >
      <PlaceholderInput onAddClick={onChoose}>
        {teaser && (
          <Teaser>
            <ContentForTeaser
              teaser={teaser}
              numColumns={numColumns}
            />
            <IconWrapper>
              <IconButtonTooltip caption={t('blocks.flexTeaser.chooseTeaser')}>
                <IconButton
                  icon={<MdArticle />}
                  onClick={onChoose}
                />
              </IconButtonTooltip>

              <IconButtonTooltip caption={t('blocks.flexTeaser.editTeaser')}>
                <IconButton
                  icon={<MdEdit />}
                  onClick={onEdit}
                />
              </IconButtonTooltip>

              <IconButtonTooltip caption={t('blocks.flexTeaser.deleteTeaser')}>
                <IconButton
                  icon={<MdDelete />}
                  onClick={onRemove}
                />
              </IconButtonTooltip>
            </IconWrapper>
          </Teaser>
        )}
      </PlaceholderInput>
    </Panel>
  );
}

export type ContentForTeaserProps = {
  teaser: TeaserTypeMixed;
  numColumns?: number;
};

export function ContentForTeaser({
  teaser,
  numColumns,
}: ContentForTeaserProps) {
  const { t } = useTranslation();
  switch (teaser.type) {
    case TeaserType.Article: {
      const states = [];

      if (teaser?.article?.draft)
        states.push(t('articleEditor.panels.stateDraft'));
      if (teaser?.article?.pending)
        states.push(t('articleEditor.panels.statePending'));
      if (teaser?.article?.published)
        states.push(t('articleEditor.panels.statePublished'));

      return (
        <TeaserContent
          image={teaser.image ?? teaser.article.latest.image ?? undefined}
          preTitle={
            teaser.preTitle ?? teaser.article.latest.preTitle ?? undefined
          }
          title={teaser.title ?? teaser.article.latest.title ?? ''}
          lead={teaser.lead ?? teaser.article.latest.lead ?? undefined}
          states={states}
          numColumns={numColumns}
        />
      );
    }

    case TeaserType.Page: {
      const states = [];

      if (teaser?.page?.draft)
        states.push(t('articleEditor.panels.stateDraft'));
      if (teaser?.page?.pending)
        states.push(t('articleEditor.panels.statePending'));
      if (teaser?.page?.published)
        states.push(t('articleEditor.panels.statePublished'));

      return (
        <TeaserContent
          image={teaser.image ?? teaser.page.latest.image ?? undefined}
          title={teaser.title ?? teaser.page.latest.title ?? ''}
          lead={teaser.lead ?? teaser.page.latest.description ?? undefined}
          states={states}
          numColumns={numColumns}
        />
      );
    }

    case TeaserType.Event: {
      return (
        <TeaserContent
          image={teaser.image ?? teaser.event.image ?? undefined}
          title={teaser.title ?? teaser.event.name ?? ''}
          lead={
            teaser.lead ||
            teaser.event.lead ||
            teaser.event.location ||
            undefined
          }
          numColumns={numColumns}
        />
      );
    }

    case TeaserType.Custom: {
      return (
        <TeaserContent
          contentUrl={teaser.contentUrl}
          image={teaser.image ?? undefined}
          title={teaser.title}
          lead={teaser.lead ?? undefined}
          numColumns={numColumns}
        />
      );
    }

    default:
      return null;
  }
}

export interface TeaserContentProps {
  preTitle?: string | null;
  title?: string | null;
  lead?: string | null;
  image?: FullImageFragment;
  states?: string[];
  numColumns?: number;
  contentUrl?: string | null;
}

const OverlayComponent = styled(Overlay)<{ isDisabled?: boolean }>`
  bottom: 0;
  width: 100%;
  padding: 10px;
  height: ${({ isDisabled }) => (isDisabled ? '100%' : 'auto')};
`;

export function TeaserContent({
  preTitle,
  contentUrl,
  title,
  lead,
  image,
  states,
  numColumns,
}: TeaserContentProps) {
  const { t } = useTranslation();
  const stateJoin = states?.join(' / ');
  return (
    <>
      <TeaserContentWrapper>
        {image ?
          <TeaserImage
            src={
              numColumns === 1 ?
                (image.column1URL ?? '')
              : (image.column6URL ?? '')
            }
          />
        : <PlaceholderImage />}
      </TeaserContentWrapper>

      <OverlayComponent>
        <Content>
          {contentUrl && <div>{contentUrl}</div>}
          {preTitle && (
            <Typography
              variant="subtitle1"
              color="white"
              spacing="small"
              ellipsize
            >
              {preTitle}
            </Typography>
          )}

          <Typography
            variant="body2"
            color="white"
            spacing="small"
          >
            {title || t('articleEditor.panels.untitled')}
          </Typography>

          {lead && (
            <Typography
              variant="subtitle1"
              color="white"
              ellipsize
            >
              {lead}
            </Typography>
          )}
        </Content>

        <TeaserInfoWrapper>
          <Status>
            <Typography
              variant="subtitle1"
              color="gray"
            >
              {t('articleEditor.panels.status', { stateJoin })}
            </Typography>
          </Status>
        </TeaserInfoWrapper>
      </OverlayComponent>
    </>
  );
}
