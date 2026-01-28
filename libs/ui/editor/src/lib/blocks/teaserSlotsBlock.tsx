import styled from '@emotion/styled';
import {
  TeaserSlotsAutofillConfigInput,
  TeaserSlotType,
} from '@wepublish/editor/api-v2';
import arrayMove from 'array-move';
import { ChangeEvent, ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArticle, MdDelete, MdEdit } from 'react-icons/md';
import {
  SortableContainer,
  SortableElement,
  SortEnd,
} from 'react-sortable-hoc';
import {
  Button,
  Drawer,
  IconButton as RIconButton,
  Panel as RPanel,
  Toggle,
} from 'rsuite';

import {
  IconButtonTooltip,
  PlaceholderInput,
  TypographicTextArea,
} from '../atoms';
import { BlockProps } from '../atoms/blockList';
import { TeaserEditPanel } from '../panel/teaserEditPanel';
import { TeaserSelectAndEditPanel } from '../panel/teaserSelectAndEditPanel';
import { ContentForTeaser } from './teaserGridBlock';
import { TeaserSlotsAutofillControls } from './teaserSlots/teaser-slots-autofill-controls';
import { Teaser as TeaserTypeMixed, TeaserSlotsBlockValue } from './types';
// import {AdTeaser, AdTeaserWrapper} from '@wepublish/ui/editor'

const IconButton = styled(RIconButton)`
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
  border: 2px dashed #ccc;
  background: #fcfcfc;
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
`;
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
`;

const GridItem = SortableElement<TeaserSlotProps>((props: TeaserSlotProps) => {
  return <TeaserSlot {...props} />;
});

const TeaserSlotsControls = styled.div`
  margin-top: 20px;
`;

interface GridProps {
  numColumns: number;
  children?: ReactNode;
}

export const TeaserSlotsBlockWrapper = styled.div``;

const Grid = SortableContainer<GridProps>(
  ({ children, numColumns }: GridProps) => {
    return (
      <SortableContainerComponent numColumns={numColumns}>
        {children}
      </SortableContainerComponent>
    );
  }
);

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

  function handleSortStart() {
    document.documentElement.style.cursor = 'grabbing';
    document.body.style.pointerEvents = 'none';
  }

  function handleSortEnd({ oldIndex, newIndex }: SortEnd) {
    document.documentElement.style.cursor = '';
    document.body.style.pointerEvents = '';

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
      <Grid
        numColumns={numColumns}
        axis="xy"
        distance={10}
        onSortStart={handleSortStart}
        onSortEnd={handleSortEnd}
      >
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
            <GridItem
              key={index}
              index={index}
              teaser={teaser}
              numColumns={numColumns}
              showGrabCursor={slots.length !== 1}
              disabled={slots.length === 1}
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
          );
        })}
      </Grid>
      <TeaserSlotsControls>
        <Button onClick={handleAddSlot}>
          {t('blocks.teaserSlots.addSlot')}
        </Button>
      </TeaserSlotsControls>
      <Drawer
        open={isEditModalOpen}
        size="sm"
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
        open={isChooseModalOpen}
        size="md"
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
    <Panel
      bodyFill
      showGrabCursor={showGrabCursor}
    >
      <Teaser>
        <TeaserWrapper autofill={!manualOverride}>
          {manualOverride && !teaser && (
            <PlaceholderInput onAddClick={onChoose} />
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
              <IconButtonTooltip caption={t('blocks.flexTeaser.chooseTeaser')}>
                <IconButton
                  icon={<MdArticle />}
                  onClick={onChoose}
                  appearance={'subtle'}
                />
              </IconButtonTooltip>
              <IconButtonTooltip caption={t('blocks.flexTeaser.editTeaser')}>
                <IconButton
                  icon={<MdEdit />}
                  onClick={onEdit}
                  appearance={'subtle'}
                />
              </IconButtonTooltip>
              <IconButtonTooltip caption={t('blocks.flexTeaser.deleteTeaser')}>
                <IconButton
                  icon={<MdDelete />}
                  onClick={onRemove}
                  appearance={'subtle'}
                />
              </IconButtonTooltip>
            </>
          )}
          {autofillEnabled && (
            <>
              <span>{manualOverride ? 'Manual' : 'Auto'}</span>
              <Toggle
                onClick={toggleSlotType}
                checked={manualOverride}
              />
            </>
          )}
        </TeaserToolbar>

        <SlotToolbar>
          <IconButtonTooltip caption={t('blocks.flexTeaser.deleteTeaser')}>
            <IconButton
              icon={<MdDelete />}
              onClick={onDelete}
              appearance={'subtle'}
            />
          </IconButtonTooltip>
        </SlotToolbar>
      </Teaser>
    </Panel>
  );
}
