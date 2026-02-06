import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import styled from '@emotion/styled';
import { BlockType } from '@wepublish/editor/api-v2';
import i18next from 'i18next';
import nanoid from 'nanoid';
import React, {
  ComponentType,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import GridLayoutWithoutChildren, {
  ReactGridLayoutProps,
} from 'react-grid-layout';
import { useTranslation } from 'react-i18next';
import {
  MdAddBox,
  MdArticle,
  MdDelete,
  MdEdit,
  MdLock,
  MdLockOpen,
} from 'react-icons/md';
import {
  Button,
  ButtonToolbar as RButtonToolbar,
  Drawer,
  IconButton as RIconButton,
  Panel as RPanel,
} from 'rsuite';

import {
  type BlockListValue,
  BlockListItem,
  BlockStyleIconWrapper,
  LeftButtonsWrapper,
  ListItem,
  PanelWrapper,
} from '../atoms/blockList';
import { BlockMapType, BlockProps } from '../atoms/blockList';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { BlockSelectAndEditPanel } from '../panel/blockSelectAndEditPanel';
import { isFunctionalUpdate, isValueConstructor } from '../utility';
import { BlockMap } from './blockMap';
import { IconWrapper } from './teaserGridBlock';
import {
  BlockValue,
  FlexAlignment,
  FlexBlockValue,
  FlexBlockWithAlignment,
} from './types';

const IconButton = styled(RIconButton)`
  margin: 10px;
`;

const Block = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.025);
  display: grid;
  grid-template-rows: auto min-content;
`;

// Fixes that pre React 18, all components had the children prop.
// With React 18 this is not the case anymore, so some types are wrong
const GridLayout: ComponentType<PropsWithChildren<ReactGridLayoutProps>> =
  GridLayoutWithoutChildren;

const GridLayoutStyled = styled(GridLayout)`
  .react-resizable-handle {
    z-index: 3;
  }

  & .react-grid-item[data-is-editing='true'] {
    ${Block} {
      background-color: rgba(52, 152, 255, 0.25);
    }
  }
`;

const ButtonToolbar = styled(RButtonToolbar)`
  top: 0;
  left: 0;
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: start;
  justify-content: start;
  flex-wrap: unset;
  position: relative;
  z-index: 2;
  line-height: unset;
  padding: 0.6rem 0.4rem;
  pointer-events: none;
  gap: 0.1rem;
`;

const ToolbarButton = styled(RIconButton)`
  aspect-ratio: 1;
  padding: 0.15rem !important;
  width: 1.5rem;
  height: 1.5rem;
  line-height: unset !important;
  text-align: unset;
  overflow: visible;
  position: relative;
  display: flex;
  align-content: center;
  justify-content: center;
  align-items: center;
  pointer-events: all;
  background-color: #eeeeee;

  & svg {
    display: block;
    height: 1.2rem;
    width: 1.2rem;
    margin: auto;
    font-size: unset;
  }

  & + button {
    margin: 0 !important;
  }
`;

const Panel = styled(RPanel, {
  shouldForwardProp: prop => prop !== 'showGrabCursor',
})<{ showGrabCursor: boolean }>`
  display: grid;
  cursor: ${({ showGrabCursor }) => showGrabCursor && 'grab'};
  height: inherit;
  overflow: hidden;
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const NestedBlockEditPanel = styled('div')`
  margin: 0 -25px;
  box-shadow: 1px 0 11px 4px rgba(52, 152, 255, 0.25);
  border-radius: 0.3rem;
  padding: 5px;

  ${ListItem} {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: min-content auto;
    row-gap: 10px;
  }

  ${BlockStyleIconWrapper} {
    justify-self: end;
  }

  ${PanelWrapper} {
    order: 2;

    & > div:first-of-type {
      border-width: 0;
      border-top-width: 1px;
      border-radius: 0;
    }
  }

  ${LeftButtonsWrapper} {
    display: none;
  }
`;

export function FlexItem({
  block,
  showGrabCursor,
  onEdit,
  onChoose,
  onRemove,
}: FlexItemProps) {
  return (
    <Panel
      bodyFill
      showGrabCursor={showGrabCursor}
    >
      <PlaceholderInput onAddClick={onChoose}>
        {block && (
          <Block>
            <ContentForFlexBlock block={block} />

            <IconWrapper>
              <IconButtonTooltip
                caption={i18next.t('blocks.flexBlock.chooseNestedBlock')}
              >
                <IconButton
                  icon={<MdArticle />}
                  onClick={onChoose}
                />
              </IconButtonTooltip>

              <IconButtonTooltip
                caption={i18next.t('blocks.flexBlock.editNestedBlock')}
              >
                <IconButton
                  icon={<MdEdit />}
                  onClick={onEdit}
                />
              </IconButtonTooltip>

              <IconButtonTooltip
                caption={i18next.t('blocks.flexBlock.deleteNestedBlock')}
              >
                <IconButton
                  icon={<MdDelete />}
                  onClick={onRemove}
                />
              </IconButtonTooltip>
            </IconWrapper>
          </Block>
        )}
      </PlaceholderInput>
    </Panel>
  );
}

const ContentForFlexBlockWrapper = styled('div')`
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  align-self: end;
  padding: 0.25rem;
  background-color: rgba(0, 0, 0, 0.4);
  min-height: 2.5rem;
  color: white;
`;

export const ContentForFlexBlock = ({ block }: { block: BlockValue }) => {
  const { value } = block;
  return (
    <ContentForFlexBlockWrapper>
      {(value && (value as { title: string }).title) ?? ''}
    </ContentForFlexBlockWrapper>
  );
};

export function FlexBlock({ value, onChange }: BlockProps<FlexBlockValue>) {
  const [editIndex, setEditIndex] = useState(0);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const blockMap = BlockMap as BlockMapType;
  const { blocks } = value;

  const { t } = useTranslation();

  useEffect(() => {
    if (isDragging) {
      document.documentElement.style.cursor = 'grabbing';
      document.body.style.pointerEvents = 'none';
    } else {
      document.documentElement.style.cursor = '';
      document.body.style.pointerEvents = '';
    }
  }, [isDragging]);

  const handleAddNestedBlock = () => {
    const newBlock: FlexBlockWithAlignment = {
      alignment: {
        i: nanoid(),
        x: 0,
        y: 0,
        w: 4,
        h: 4,
        static: false,
      },
      block: null,
    };

    onChange({ ...value, blocks: [...blocks, newBlock] });
  };

  const handleRemoveNestedBlock = (index: string) => {
    onChange({
      ...value,
      blocks: blocks.filter(flexTeaser => flexTeaser.alignment.i !== index),
    });
  };

  const handleLayoutChange = (layout: FlexAlignment[]) => {
    const newBlocks = layout.map(v => ({
      block: blocks.find(block => v.i === block.alignment.i)?.block,
      alignment: {
        i: v.i,
        x: v.x,
        y: v.y,
        w: v.w,
        h: v.h,
        static: v.static,
      },
    }));

    onChange({ ...value, blocks: newBlocks });
  };

  const handlePinNestedBlock = (index: string) => {
    const newBlocks = blocks.map(({ block, alignment }) => {
      return alignment.i === index ?
          {
            block,
            alignment: {
              i: alignment.i,
              x: alignment.x,
              y: alignment.y,
              w: alignment.w,
              h: alignment.h,
              static: !alignment.static,
            },
          }
        : { block, alignment };
    });

    onChange({ ...value, blocks: newBlocks });
  };

  const handleRemoveBlock = (index: string) => {
    onChange({
      ...value,
      blocks: blocks.map(({ block, alignment }) => {
        return alignment.i === index ?
            { alignment, block: null }
          : { block, alignment };
      }),
    });
  };

  const handleBlockLinkChange = (index: number, block: { id: BlockType }) => {
    const newBlock = createBlock(block.id);

    onChange({
      ...value,
      blocks: Object.assign([], blocks, {
        [index]: { ...blocks[index], block: newBlock },
      }),
    });
  };

  const handleItemChange = useCallback(
    (index: number, itemValue: React.SetStateAction<BlockListValue>) => {
      const current = value.blocks[index]?.block as BlockValue | null;
      if (!current) return;

      const resolved =
        isFunctionalUpdate(itemValue) ?
          (
            itemValue as (
              value: BlockValue | BlockListValue
            ) => BlockValue | BlockListValue
          )(current)
        : itemValue;

      const updatedBlock: BlockValue =
        isBlockValue(resolved) ? resolved : (
          ({ ...current, value: resolved } as BlockValue)
        );

      const updatedBlocks = value.blocks.map((block, idx) =>
        idx === index ? { ...block, block: updatedBlock } : block
      );

      onChange({ ...value, blocks: updatedBlocks });
    },
    [onChange, value]
  );

  const createBlock = (type: string) => {
    const { defaultValue } = blockMap[type];
    return {
      key: nanoid(),
      type,
      value: isValueConstructor(defaultValue) ? defaultValue() : defaultValue,
    } as BlockListValue;
  };

  const handleClose = () => {
    setEditModalOpen(false);
    setChooseModalOpen(false);
    setEditIndex(0);
  };

  return (
    <>
      <IconButtonTooltip caption={t('blocks.flexBlock.addNestedBlock')}>
        <RIconButton
          icon={<MdAddBox />}
          appearance="primary"
          circle
          size="md"
          onClick={handleAddNestedBlock}
        />
      </IconButtonTooltip>
      <GridLayoutStyled
        onResizeStop={layout => handleLayoutChange(layout as FlexAlignment[])}
        onDrop={layout => handleLayoutChange(layout as FlexAlignment[])}
        className="layout"
        resizeHandles={['se']}
        onDragStop={layout => {
          setIsDragging(false);
          handleLayoutChange(layout as FlexAlignment[]);
        }}
        onDrag={() => setIsDragging(true)} // buggy behavior with onDragStart with double click
        cols={12}
        rowHeight={30}
        layout={blocks.map(ft => ft.alignment) as FlexAlignment[]}
        width={640}
      >
        {blocks.map((block, index) => (
          <div
            key={index}
            data-is-editing={
              isEditModalOpen && index === editIndex ? 'true' : 'false'
            }
          >
            <FlexItem
              block={block.block}
              showGrabCursor={!block.alignment.static}
              onEdit={() => {
                setEditIndex(index);
                setEditModalOpen(true);
              }}
              onChoose={() => {
                setEditIndex(index);
                setChooseModalOpen(true);
                setEditModalOpen(false);
              }}
              onRemove={() => handleRemoveBlock(block.alignment.i)}
            />

            <ButtonToolbar>
              {!block.block && (
                <IconButtonTooltip
                  caption={t('blocks.flexBlock.removeNestedBlock')}
                >
                  <ToolbarButton
                    disabled={block.alignment.static as unknown as boolean}
                    block
                    appearance="subtle"
                    icon={<MdDelete />}
                    onClick={() => handleRemoveNestedBlock(block.alignment.i)}
                  />
                </IconButtonTooltip>
              )}

              <IconButtonTooltip
                caption={
                  !block.alignment.static ?
                    t('blocks.flexBlock.lockNestedBlock')
                  : t('blocks.flexBlock.unlockNestedBlock')
                }
              >
                <ToolbarButton
                  block
                  appearance="subtle"
                  icon={block.alignment.static ? <MdLockOpen /> : <MdLock />}
                  onClick={() => handlePinNestedBlock(block.alignment.i)}
                />
              </IconButtonTooltip>
            </ButtonToolbar>
          </div>
        ))}
      </GridLayoutStyled>
      <Drawer
        open={isChooseModalOpen}
        size="xs"
        onClose={handleClose}
      >
        <BlockSelectAndEditPanel
          onClose={handleClose}
          onSelect={block => {
            setChooseModalOpen(false);
            handleBlockLinkChange(editIndex, block);
          }}
        />
      </Drawer>
      {isEditModalOpen &&
        (() => {
          const blockWithAlignment = value.blocks[editIndex];
          const currentBlock = blockWithAlignment?.block;

          if (!currentBlock) return null;

          return (
            <NestedBlockEditPanel>
              <Button
                appearance={'subtle'}
                onClick={handleClose}
              >
                {t('blocks.flexBlock.close')}
              </Button>
              <BlockListItem
                itemId={blockWithAlignment.alignment.i}
                index={editIndex}
                value={{
                  value: currentBlock.value,
                  key: currentBlock.key,
                  type: currentBlock.type,
                }}
                icon={blockMap[currentBlock.type].icon}
                autofocus={false}
                disabled={false}
                children={blockMap[currentBlock.type].field}
                onChange={handleItemChange}
                onDelete={() => {
                  // will never happen here
                }}
                onMoveUp={() => {
                  // will never happen here
                }}
                onMoveDown={() => {
                  // will never happen here
                }}
              />
            </NestedBlockEditPanel>
          );
        })()}
    </>
  );
}

interface FlexItemProps {
  block: BlockValue | null | undefined;
  showGrabCursor: boolean;
  onEdit: () => void;
  onChoose: () => void;
  onRemove: () => void;
}

export const isBlockValue = (obj: unknown): obj is BlockValue => {
  return (
    !!obj &&
    typeof obj === 'object' &&
    ['type', 'key', 'value'].every(prop => prop in obj)
  );
};
