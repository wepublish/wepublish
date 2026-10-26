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
} from '@dnd-kit/sortable';
import styled from '@emotion/styled';
import { Button, Drawer, IconButton as MuiIconButton } from '@mui/material';
import {
  TeaserSlotsAutofillConfigInput,
  TeaserSlotType,
} from '@wepublish/editor/api';
import { ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdArticle,
  MdDelete,
  MdEdit,
  MdOutlinePushPin,
  MdPushPin,
} from 'react-icons/md';

import {
  IconButtonTooltip,
  PlaceholderInput,
  TypographicTextArea,
} from '../atoms';
import { BlockProps } from '../atoms/blockList';
import { DRAWER_WIDTHS } from '../drawer';
import { TeaserEditPanel } from '../panel/teaserEditPanel';
import { TeaserSelectAndEditPanel } from '../panel/teaserSelectAndEditPanel';
import {
  ContentForTeaser,
  IconWrapper,
  SortableTeaser,
} from './teaserGridBlock';
import { TeaserSlotsAutofillControls } from './teaserSlots/teaser-slots-autofill-controls';
import { Teaser as TeaserTypeMixed, TeaserSlotsBlockValue } from './types';
// import {AdTeaser, AdTeaserWrapper} from '@wepublish/ui/editor'

const IconButton = styled(MuiIconButton)`
  padding: 5px !important;
`;

const SortableContainerComponent = styled.div<{ numColumns: number }>`
  display: grid;
  grid-template-columns: repeat(
    ${({ numColumns }) => numColumns},
    minmax(0, 1fr)
  );
  gap: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 899px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 599px) {
    grid-template-columns: minmax(0, 1fr);
  }
  user-select: none;

  img {
    user-drag: none;
  }
`;

const Panel = styled('div', {
  shouldForwardProp: prop => prop !== 'showGrabCursor',
})<{ showGrabCursor: boolean }>`
  display: grid;
  cursor: ${({ showGrabCursor }) => showGrabCursor && 'grab'};
  height: 300px;
  overflow: hidden;
  z-index: 1;
`;

const Teaser = styled('div')`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background: ${({ theme }) => theme.vars.palette.background.default};
`;

const TeaserWrapper = styled('div', {
  shouldForwardProp: prop => prop !== 'autofill',
})<{ autofill: boolean }>`
  width: 100%;
  height: 100%;
  opacity: ${({ autofill }) => (autofill ? 0.4 : 1)};
`;

const TeaserSlotsControls = styled('div')``;

export const TeaserSlotsBlockWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export function TeaserSlotsBlock({
  value,
  onChange: onChangeTop,
}: BlockProps<TeaserSlotsBlockValue>) {
  const onChange = (data: any) => {
    onChangeTop(data);
  };
  const numColumns = 3;
  const [editIndex, setEditIndex] = useState(0);
  const { t } = useTranslation();

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const { autofillConfig, slots, autofillTeasers } = value;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  const slotIds = slots.map((_, index) => `slot-${index}`);

  function handleTeaserLinkChange(
    index: number,
    teaser: TeaserTypeMixed | null
  ) {
    onChange({
      ...value,
      slots: Object.assign([], slots, {
        [index]: { ...slots[index], teaser },
      }),
    });
  }

  function handleSlotTypeChange(index: number, type: TeaserSlotType) {
    onChange({
      ...value,
      slots: Object.assign([], slots, {
        [index]: { ...slots[index], type, teaser: null },
      }),
    });
  }

  function handleSlotDelete(index: number) {
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    onChange({
      ...value,
      slots: newSlots,
    });
  }

  function handleAddSlot() {
    onChange({
      ...value,
      slots: [
        ...slots,
        {
          type:
            autofillConfig.enabled ?
              TeaserSlotType.Autofill
            : TeaserSlotType.Manual,
          teaser: null,
        },
      ],
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = slotIds.indexOf(active.id as string);
    const newIndex = slotIds.indexOf(over.id as string);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onChange({
      ...value,
      slots: arrayMove(slots, oldIndex, newIndex),
    });
  }

  function handleTitleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange({
      ...value,
      title: e.target.value,
    });
  }

  function handleAutofillConfigChange(
    newAutofillConfig: TeaserSlotsAutofillConfigInput
  ) {
    let newSlots = slots;
    if (!autofillConfig.enabled && newAutofillConfig.enabled) {
      newSlots = [
        ...slots.map(slot =>
          !slot?.teaser ? { type: TeaserSlotType.Autofill, teaser: null } : slot
        ),
      ];
    }
    if (autofillConfig.enabled && !newAutofillConfig.enabled) {
      newSlots = [
        ...slots.map(slot =>
          slot.type === TeaserSlotType.Autofill ?
            {
              type: TeaserSlotType.Manual,
              teaser: null,
            }
          : slot
        ),
      ];
    }

    onChange({
      ...value,
      slots: newSlots,
      autofillConfig: newAutofillConfig,
    });
  }

  const autofillSlotsCount = useMemo(
    () => slots.filter(slot => slot.type === TeaserSlotType.Autofill).length,
    [slots]
  );

  return (
    <TeaserSlotsBlockWrapper>
      <TypographicTextArea
        //ref={focusRef}
        variant="title"
        align="center"
        placeholder={t('blocks.title.title')}
        value={value.title ?? ''}
        onChange={handleTitleChange}
      />
      <TeaserSlotsAutofillControls
        config={autofillConfig}
        onConfigChange={handleAutofillConfigChange}
        loadedTeasers={autofillTeasers?.length ?? 0}
        autofillSlots={autofillSlotsCount}
      />
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slotIds}
          strategy={rectSortingStrategy}
        >
          <SortableContainerComponent numColumns={numColumns}>
            {slots.map(({ type, teaser: manualTeaser }, index) => {
              const autofillIndex = slots
                .slice(0, index)
                .filter(slot => slot.type === TeaserSlotType.Autofill).length;
              const teaser = (
                type === TeaserSlotType.Manual ?
                  manualTeaser
                : (autofillTeasers[autofillIndex] ??
                  null)) as TeaserTypeMixed | null;

              return (
                <SortableTeaser
                  key={slotIds[index]}
                  id={slotIds[index]}
                  disabled={slots.length === 1}
                >
                  <TeaserSlot
                    teaser={teaser}
                    numColumns={numColumns}
                    showGrabCursor={slots.length !== 1}
                    onEdit={() => {
                      setEditIndex(index);
                      setEditModalOpen(true);
                    }}
                    onDelete={() => {
                      handleSlotDelete(index);
                    }}
                    onChoose={() => {
                      setEditIndex(index);
                      setChooseModalOpen(true);
                    }}
                    onRemove={() => {
                      handleTeaserLinkChange(index, null);
                    }}
                    slotType={type}
                    onSlotTypeChange={type => handleSlotTypeChange(index, type)}
                    autofillEnabled={autofillConfig.enabled}
                  />
                </SortableTeaser>
              );
            })}
          </SortableContainerComponent>
        </SortableContext>
      </DndContext>
      <TeaserSlotsControls>
        <Button
          variant="text"
          startIcon={<MdAdd />}
          onClick={handleAddSlot}
        >
          {t('blocks.teaserSlots.addSlot')}
        </Button>
      </TeaserSlotsControls>
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
      >
        {slots[editIndex] && (
          <TeaserEditPanel
            initialTeaser={slots[editIndex].teaser!}
            onClose={() => setEditModalOpen(false)}
            onConfirm={teaser => {
              setEditModalOpen(false);
              handleTeaserLinkChange(editIndex, teaser);
            }}
          />
        )}
      </Drawer>
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.md,
              maxWidth: '100vw',
            },
          },
        }}
        open={isChooseModalOpen}
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
    </TeaserSlotsBlockWrapper>
  );
}

export interface TeaserSlotProps {
  teaser?: TeaserTypeMixed | null;
  showGrabCursor: boolean;
  numColumns: number;
  onEdit: () => void;
  onDelete: () => void;
  onChoose: () => void;
  onRemove: () => void;
  onSlotTypeChange: (slotType: TeaserSlotType) => void;
  slotType: TeaserSlotType;
  autofillEnabled: boolean;
}

export function TeaserSlot({
  teaser,
  numColumns,
  showGrabCursor,
  onEdit,
  onChoose,
  onDelete,
  onRemove,
  onSlotTypeChange,
  slotType,
  autofillEnabled,
}: TeaserSlotProps) {
  const { t } = useTranslation();

  const manualOverride = slotType === TeaserSlotType.Manual;
  const toggleSlotType = () =>
    onSlotTypeChange(
      manualOverride ? TeaserSlotType.Autofill : TeaserSlotType.Manual
    );

  return (
    <Panel showGrabCursor={showGrabCursor}>
      <Teaser>
        <TeaserWrapper autofill={!manualOverride}>
          {manualOverride && !teaser && (
            <PlaceholderInput
              onAddClick={onChoose}
              addLabel={t('blocks.flexTeaser.chooseTeaser')}
            />
          )}
          {teaser && (
            <ContentForTeaser
              teaser={teaser}
              numColumns={numColumns}
            />
          )}
        </TeaserWrapper>
        <IconWrapper role="toolbar">
          {autofillEnabled && (
            <IconButtonTooltip caption={t('blocks.teaserSlots.manualSlotHelp')}>
              <MuiIconButton
                size="small"
                aria-label={t('blocks.teaserSlots.manualSlot')}
                aria-pressed={manualOverride}
                onClick={toggleSlotType}
              >
                {manualOverride ?
                  <MdPushPin />
                : <MdOutlinePushPin />}
              </MuiIconButton>
            </IconButtonTooltip>
          )}

          {manualOverride && teaser ?
            <>
              <IconButtonTooltip caption={t('blocks.flexTeaser.chooseTeaser')}>
                <MuiIconButton
                  size="small"
                  aria-label={t('blocks.flexTeaser.chooseTeaser')}
                  onClick={onChoose}
                >
                  <MdArticle />
                </MuiIconButton>
              </IconButtonTooltip>
              <IconButtonTooltip caption={t('blocks.flexTeaser.editTeaser')}>
                <MuiIconButton
                  size="small"
                  aria-label={t('blocks.flexTeaser.editTeaser')}
                  onClick={onEdit}
                >
                  <MdEdit />
                </MuiIconButton>
              </IconButtonTooltip>
              <IconButtonTooltip caption={t('blocks.flexTeaser.deleteTeaser')}>
                <MuiIconButton
                  size="small"
                  aria-label={t('blocks.flexTeaser.deleteTeaser')}
                  onClick={onRemove}
                >
                  <MdDelete />
                </MuiIconButton>
              </IconButtonTooltip>
            </>
          : <IconButtonTooltip caption={t('blocks.teaserSlots.deleteSlot')}>
              <MuiIconButton
                size="small"
                aria-label={t('blocks.teaserSlots.deleteSlot')}
                onClick={onDelete}
              >
                <MdDelete />
              </MuiIconButton>
            </IconButtonTooltip>
          }
        </IconWrapper>
      </Teaser>
    </Panel>
  );
}
