import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import styled from '@emotion/styled';
import i18next from 'i18next';
import nanoid from 'nanoid';
import { ComponentType, PropsWithChildren, useEffect, useState } from 'react';
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
  ButtonToolbar as RButtonToolbar,
  IconButton as RIconButton,
  Panel as RPanel,
} from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { PlaceholderInput } from '../atoms/placeholderInput';
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

const Teaser = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

// Fixes that pre React 18, all components had the children prop.
// With React 18 this is not the case anymore, so some types are wrong
const GridLayout: ComponentType<PropsWithChildren<ReactGridLayoutProps>> =
  GridLayoutWithoutChildren;

const ButtonToolbar = styled(RButtonToolbar)`
  top: 0;
  left: 0;
  position: absolute;
`;

const Panel = styled(RPanel, {
  shouldForwardProp: prop => prop !== 'showGrabCursor',
})<{ showGrabCursor: boolean }>`
  display: grid;
  cursor: ${({ showGrabCursor }) => showGrabCursor && 'grab'};
  height: inherit;
  overflow: hidden;
  z-index: 1;
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
          <Teaser>
            {/* <ContentForTeaser teaser={block} /> */}

            <IconWrapper>
              <IconButtonTooltip
                caption={i18next.t('blocks.flexTeaser.chooseTeaser')}
              >
                <IconButton
                  icon={<MdArticle />}
                  onClick={onChoose}
                />
              </IconButtonTooltip>

              <IconButtonTooltip
                caption={i18next.t('blocks.flexTeaser.editTeaser')}
              >
                <IconButton
                  icon={<MdEdit />}
                  onClick={onEdit}
                />
              </IconButtonTooltip>

              <IconButtonTooltip
                caption={i18next.t('blocks.flexTeaser.deleteTeaser')}
              >
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

export function FlexBlock({ value, onChange }: BlockProps<FlexBlockValue>) {
  const [editItem, setEditItem] = useState<FlexBlockWithAlignment>();

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleAddTeaserBlock = () => {
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

  const handleRemoveTeaserBlock = (index: string) => {
    onChange({
      ...value,
      blocks: blocks.filter(flexTeaser => flexTeaser.alignment.i !== index),
    });
  };

  const handleLayoutChange = (layout: FlexAlignment[]) => {
    const newBlocks = layout.map(v => ({
      block: blocks.find(flexTeaser => v.i === flexTeaser.alignment.i)?.block,
      //alignment: v,
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

  const handlePinTeaserBlock = (index: string) => {
    const newTeasers = blocks.map(({ block, alignment }) => {
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

    onChange({ ...value, blocks: newTeasers });
  };

  function handleRemoveBlock(index: string) {
    onChange({
      ...value,
      blocks: blocks.map(({ block, alignment }) => {
        return alignment.i === index ?
            { alignment, block: null }
          : { block, alignment };
      }),
    });
  }

  return (
    <>
      <IconButtonTooltip caption={t('blocks.flexTeaser.addBlock')}>
        <RIconButton
          icon={<MdAddBox />}
          appearance="primary"
          circle
          size="md"
          onClick={handleAddTeaserBlock}
        />
      </IconButtonTooltip>

      <GridLayout
        onResizeStop={layout => handleLayoutChange(layout as FlexAlignment[])}
        onDrop={layout => handleLayoutChange(layout as FlexAlignment[])}
        className="layout"
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
        {blocks.map(block => (
          <div key={block.alignment.i}>
            <FlexItem
              block={block.block}
              showGrabCursor={!block.alignment.static}
              onEdit={() => {
                setEditItem(block);
                setEditModalOpen(true);
              }}
              onChoose={() => {
                setEditItem(block);
                setChooseModalOpen(true);
              }}
              onRemove={() => handleRemoveBlock(block.alignment.i)}
            />

            <ButtonToolbar>
              {!block.block && (
                <IconButtonTooltip caption={t('blocks.flexTeaser.removeBlock')}>
                  <RIconButton
                    disabled={block.alignment.static as unknown as boolean}
                    block
                    appearance="subtle"
                    icon={<MdDelete />}
                    onClick={() => handleRemoveTeaserBlock(block.alignment.i)}
                  />
                </IconButtonTooltip>
              )}

              <IconButtonTooltip
                caption={
                  !block.alignment.static ?
                    t('blocks.block.lockBlock')
                  : t('blocks.block.unlockBlock')
                }
              >
                <RIconButton
                  block
                  appearance="subtle"
                  icon={block.alignment.static ? <MdLockOpen /> : <MdLock />}
                  onClick={() => handlePinTeaserBlock(block.alignment.i)}
                />
              </IconButtonTooltip>
            </ButtonToolbar>
          </div>
        ))}
      </GridLayout>
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
