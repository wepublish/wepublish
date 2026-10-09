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
import {
  Button,
  Card as MuiCard,
  CardContent,
  Drawer,
  FormControlLabel,
  IconButton as MuiIconButton,
  Switch,
} from '@mui/material';
import {
  TeaserSlotsAutofillConfigInput,
  TeaserSlotType,
} from '@wepublish/editor/api';
import { ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArticle, MdDelete, MdEdit } from 'react-icons/md';

import {
  IconButtonTooltip,
  InfoTooltip,
  PlaceholderInput,
  TypographicTextArea,
} from '../atoms';
import { BlockProps } from '../atoms/blockList';
import { DRAWER_WIDTHS } from '../drawer';
import { TeaserEditPanel } from '../panel/teaserEditPanel';
import { TeaserSelectAndEditPanel } from '../panel/teaserSelectAndEditPanel';
import { ContentForTeaser, SortableTeaser } from './teaserGridBlock';
import { TeaserSlotsAutofillControls } from './teaserSlots/teaser-slots-autofill-controls';
import { Teaser as TeaserTypeMixed, TeaserSlotsBlockValue } from './types';
// import {AdTeaser, AdTeaserWrapper} from '@wepublish/ui/editor'

const IconButton = styled(MuiIconButton)`
  padding: 5px !important;
`;

const SortableContainerComponent = styled.div<{ numColumns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ numColumns }) => `${numColumns}`}, 1fr);
  grid-gap: 20px;
  user-select: none;

  img {
    user-drag: none;
  }
`;

const Panel = styled(MuiCard, {
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
  border: 2px dashed var(--rs-border-primary);
  border-radius: var(--rs-radius-lg);
  background: var(--rs-bg-well);
`;

const TeaserWrapper = styled('div', {
  shouldForwardProp: prop => prop !== 'autofill',
})<{ autofill: boolean }>`
  width: 100%;
  height: 100%;
  opacity: ${({ autofill }) => (autofill ? 0.4 : 1)};
`;

export const TeaserToolbar = styled.div`
  position: absolute;
  z-index: 2;
  right: 4px;
  bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--rs-bg-overlay);
  padding: 4px;
  border-radius: var(--rs-radius-md);
  font-size: 0.875rem;
`;
export const SlotToolbar = styled.div`
  position: absolute;
  z-index: 2;
  right: 4px;
  top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--rs-bg-overlay);
  padding: 4px;
  border-radius: var(--rs-radius-md);
  font-size: 0.875rem;
`;

const TeaserSlotsControls = styled.div`
  margin-top: 20px;
`;

export const TeaserSlotsBlockWrapper = styled.div``;

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
          variant="outlined"
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
              display: 'flex',
              flexDirection: 'column',
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
              display: 'flex',
              flexDirection: 'column',
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
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Teaser>
          <TeaserWrapper autofill={!manualOverride}>
            {manualOverride && !teaser && (
              <PlaceholderInput
                onAddClick={onChoose}
                addLabel={t('blocks.flexTeaser.chooseTeaser')}
              />
            )}
            {/*{!manualOverride && <span>Autofilled</span>}*/}
            {teaser && (
              <ContentForTeaser
                teaser={teaser}
                numColumns={numColumns}
              />
            )}
          </TeaserWrapper>
          <TeaserToolbar>
            {manualOverride && teaser && (
              <>
                <IconButtonTooltip
                  caption={t('blocks.flexTeaser.chooseTeaser')}
                >
                  <IconButton
                    aria-label={t('blocks.flexTeaser.chooseTeaser')}
                    onClick={onChoose}
                  >
                    <MdArticle />
                  </IconButton>
                </IconButtonTooltip>
                <IconButtonTooltip caption={t('blocks.flexTeaser.editTeaser')}>
                  <IconButton
                    aria-label={t('blocks.flexTeaser.editTeaser')}
                    onClick={onEdit}
                  >
                    <MdEdit />
                  </IconButton>
                </IconButtonTooltip>
                <IconButtonTooltip
                  caption={t('blocks.flexTeaser.deleteTeaser')}
                >
                  <IconButton
                    aria-label={t('blocks.flexTeaser.deleteTeaser')}
                    onClick={onRemove}
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              </>
            )}
            {autofillEnabled && (
              <FormControlLabel
                control={
                  <Switch
                    checked={manualOverride}
                    onChange={() => toggleSlotType()}
                  />
                }
                label={
                  <>
                    {t('blocks.teaserSlots.manualSlot')}{' '}
                    <InfoTooltip
                      text={t('blocks.teaserSlots.manualSlotHelp')}
                    />
                  </>
                }
              />
            )}
          </TeaserToolbar>

          <SlotToolbar>
            <IconButtonTooltip caption={t('blocks.teaserSlots.deleteSlot')}>
              <IconButton
                aria-label={t('blocks.teaserSlots.deleteSlot')}
                onClick={onDelete}
              >
                <MdDelete />
              </IconButton>
            </IconButtonTooltip>
          </SlotToolbar>
        </Teaser>
      </CardContent>
    </Panel>
  );
}
