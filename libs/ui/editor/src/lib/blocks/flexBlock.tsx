import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import styled from '@emotion/styled';
import {
  Button,
  Card,
  Drawer,
  IconButton as MuiIconButton,
  Stack,
  Typography,
} from '@mui/material';
import { BlockType } from '@wepublish/editor/api';
import { toPlaintext } from '@wepublish/richtext';
import { TFunction } from 'i18next';
import nanoid from 'nanoid';
import {
  ComponentType,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react';
import GridLayoutWithoutChildren, {
  ReactGridLayoutProps,
  WidthProvider,
} from 'react-grid-layout';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdArticle,
  MdDelete,
  MdEdit,
  MdLock,
  MdLockOpen,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';

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
import {
  FLEX_TILE_DRAG_CANCEL,
  FLEX_TILE_ROW_HEIGHT,
  FlexGrid,
  FlexTile,
  FlexTileAction,
} from '../atoms/flexTile';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { DRAWER_WIDTHS } from '../drawer';
import { useSeededState } from '../hooks/use-seeded-state';
import { BlockSelectAndEditPanel } from '../panel/blockSelectAndEditPanel';
import { isFunctionalUpdate, isValueConstructor } from '../utility';
import { BlockMap } from './blockMap';
import {
  BlockValue,
  EmbedBlockValue,
  EmbedType,
  FlexAlignment,
  FlexBlockValue,
  FlexBlockWithAlignment,
} from './types';

const IconButton = styled(MuiIconButton)`
  margin: 10px;
`;

const Block = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: rgb(
    from ${({ theme }) => theme.vars.palette.text.primary} r g b / 0.025
  );
  display: grid;
  grid-template-rows: auto min-content;
`;

// Fixes that pre React 18, all components had the children prop.
// With React 18 this is not the case anymore, so some types are wrong
const GridLayout: ComponentType<PropsWithChildren<ReactGridLayoutProps>> =
  WidthProvider(GridLayoutWithoutChildren);

const AddTileBar = styled('div')`
  display: flex;
  margin-block: ${({ theme }) => theme.spacing(1)};
`;

const GridLayoutStyled = styled(GridLayout)`
  .react-resizable-handle {
    z-index: 3;
  }

  & .react-grid-item[data-is-editing='true'] {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  }
`;

const ButtonToolbar = styled(Stack)`
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

const ToolbarButton = styled(MuiIconButton)`
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
  background-color: ${({ theme }) => theme.vars.palette.background.default};

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

const Panel = styled(Card, {
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

const NestedBlockEditPanel = styled('section')`
  display: grid;
  margin-top: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.vars.palette.primary.main};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

const NestedBlockEditHeader = styled('header')`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1, 2)};
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(1, 1, 1, 2)};
  border-bottom: 1px solid ${({ theme }) => theme.vars.palette.divider};
`;

const NestedBlockEditActions = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
`;

const NestedBlockEditTitle = styled(Typography)`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
`;

const NestedBlockEditBody = styled('div')`
  padding: ${({ theme }) => theme.spacing(2)};

  ${ListItem} {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    row-gap: ${({ theme }) => theme.spacing(1)};
  }

  ${LeftButtonsWrapper} {
    display: none;
  }

  ${BlockStyleIconWrapper} {
    position: static;
    order: -1;
    flex-direction: row;
    align-items: center;
    justify-self: end;
    margin: 0;
  }

  ${PanelWrapper} {
    flex-direction: column;
  }
`;

export function FlexItem({
  block,
  locked,
  onEdit,
  onChoose,
  onRemove,
  onRemoveTile,
  onToggleLock,
}: FlexItemProps) {
  const { t } = useTranslation();

  const actions: FlexTileAction[] = [
    ...(block ?
      [
        {
          label: t('blocks.flexBlock.chooseNestedBlock'),
          icon: <MdArticle />,
          onClick: onChoose,
        },
        {
          label: t('blocks.flexBlock.editNestedBlock'),
          icon: <MdEdit />,
          onClick: onEdit,
        },
        {
          label: t('blocks.flexBlock.deleteNestedBlock'),
          icon: <MdDelete />,
          onClick: onRemove,
        },
      ]
    : [
        {
          label: t('blocks.flexBlock.removeNestedBlock'),
          icon: <MdDelete />,
          onClick: onRemoveTile,
          disabled: locked,
        },
      ]),
    {
      label:
        locked ?
          t('blocks.flexBlock.unlockNestedBlock')
        : t('blocks.flexBlock.lockNestedBlock'),
      icon: locked ? <MdLockOpen /> : <MdLock />,
      onClick: onToggleLock,
    },
  ];

  return (
    <FlexTile
      locked={locked}
      empty={!block}
      dimmed={!!block?.value?.disabled}
      actions={actions}
    >
      {block ?
        <Block>
          <ContentForFlexBlock block={block} />
        </Block>
      : <PlaceholderInput
          onAddClick={onChoose}
          addLabel={t('blocks.flexBlock.chooseNestedBlock')}
          minHeight={0}
        />
      }
    </FlexTile>
  );
}

const ContentForFlexBlockWrapper = styled('div')`
  width: 100%;
  align-self: end;
  padding: 0.25rem;
  background-color: rgba(0, 0, 0, 0.4);
  min-height: 2.5rem;
  color: white;

  white-space: pre-line;
  overflow: hidden;
  text-overflow: ellipsis;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  word-wrap: break-word;
`;

const getContentHintForFlexBlockNestedBlock = (
  block: BlockListValue,
  t: TFunction
) => {
  if (!block) {
    return '';
  }

  if (block.type === 'TeaserSlots') {
    return block.value?.title || t('blocks.teaserSlots.label');
  }
  if (block.type === 'Image') {
    return block.value?.image?.filename || t('blocks.image.label');
  }
  if (block.type === 'Embed') {
    const embed = block.value as EmbedBlockValue | undefined;
    if (!embed) {
      return t('blocks.embeds.label');
    }

    switch (embed.type) {
      case EmbedType.YouTubeVideo:
        return `YouTube: ${embed.videoID || t('blocks.flexBlock.noId')}`;
      case EmbedType.VimeoVideo:
        return `Vimeo: ${embed.videoID || t('blocks.flexBlock.noId')}`;
      case EmbedType.TikTokVideo:
        return `TikTok: ${embed.videoID || t('blocks.flexBlock.noId')}`;
      case EmbedType.SoundCloudTrack:
        return `SoundCloud: ${embed.trackID || t('blocks.flexBlock.noId')}`;
      case EmbedType.InstagramPost:
        return `Instagram: ${embed.postID || t('blocks.flexBlock.noId')}`;
      case EmbedType.TwitterTweet:
        return `Twitter: ${embed.tweetID || t('blocks.flexBlock.noId')}`;
      case EmbedType.FacebookPost:
        return `Facebook Post: ${embed.postID || t('blocks.flexBlock.noId')}`;
      case EmbedType.FacebookVideo:
        return `Facebook Video: ${embed.videoID || t('blocks.flexBlock.noId')}`;
      case EmbedType.Other:
        return embed.title || embed.url || t('blocks.embeds.label');
      default:
        return t('blocks.embeds.label');
    }
  }
  if (block.type === 'RichText') {
    const text = toPlaintext(block.value?.richText);
    if (!text) {
      return t('blocks.richText.label');
    }
    if (text.length > 25) {
      return text.slice(0, 25) + '...';
    }
    return text;
  }
  if (block.type === 'Crowdfunding') {
    const name = block.value?.crowdfunding?.name;
    if (!name) {
      return t('blocks.crowdfunding.label');
    }
    if (name.length > 25) {
      return name.slice(0, 25) + '...';
    }
    return name;
  }

  if (block.type === 'Crowdfunding') {
    return block.value?.crowdfunding?.name || t('blocks.crowdfunding.label');
  }

  if (block.type === 'LinkPageBreak') {
    return block.value?.text || t('blocks.linkPageBreak.label');
  }

  return t('blocks.flexBlock.unknownBlock');
};

const oEmbedUrlForEmbed = (embed: EmbedBlockValue): string | null => {
  switch (embed.type) {
    case EmbedType.YouTubeVideo:
      return embed.videoID ?
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${embed.videoID}&format=json`
        : null;
    case EmbedType.VimeoVideo:
      return embed.videoID ?
          `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${embed.videoID}`
        : null;
    default:
      return null;
  }
};

const embedTitleCache = new Map<string, string>();

const useEmbedTitle = (embed: EmbedBlockValue | undefined): string | null => {
  const oEmbedUrl = embed ? oEmbedUrlForEmbed(embed) : null;
  const [title, setTitle] = useState<string | null>(
    () => (oEmbedUrl && embedTitleCache.get(oEmbedUrl)) || null
  );
  useSeededState(
    oEmbedUrl ? (embedTitleCache.get(oEmbedUrl) ?? null) : null,
    setTitle,
    oEmbedUrl
  );

  useEffect(() => {
    if (!oEmbedUrl) {
      return;
    }

    if (embedTitleCache.has(oEmbedUrl)) {
      return;
    }

    fetch(oEmbedUrl)
      .then(res => res.json())
      .then(data => {
        if (data.title) {
          embedTitleCache.set(oEmbedUrl, data.title);
          setTitle(data.title);
        }
      })
      .catch(() => undefined);
  }, [oEmbedUrl]);

  return title;
};

export const ContentForFlexBlock = ({ block }: { block: BlockListValue }) => {
  const embed =
    block?.type === 'Embed' ?
      (block.value as EmbedBlockValue | undefined)
    : undefined;
  const embedTitle = useEmbedTitle(embed);
  const { t } = useTranslation();

  const hint =
    embedTitle ?
      `${getContentHintForFlexBlockNestedBlock(block, t).split(':')[0]}: ${embedTitle}`
    : getContentHintForFlexBlockNestedBlock(block, t);

  return <ContentForFlexBlockWrapper>{hint}</ContentForFlexBlockWrapper>;
};

export function FlexBlock({ value, onChange }: BlockProps<FlexBlockValue>) {
  const [editIndex, setEditIndex] = useState(0);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const nestedBlockTitleId = useId();

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
        __typename: 'FlexAlignment',
        i: nanoid(),
        x: 0,
        y: 0,
        w: 4,
        h: 4,
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
    const newBlocks: FlexBlockWithAlignment[] = layout.map(v => ({
      block: blocks.find(block => v.i === block.alignment.i)?.block,
      alignment: {
        __typename: 'FlexAlignment',
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
    const newBlocks: FlexBlockWithAlignment[] = blocks.map(
      ({ block, alignment }) => {
        return alignment.i === index ?
            {
              block,
              alignment: {
                __typename: 'FlexAlignment',
                i: alignment.i,
                x: alignment.x,
                y: alignment.y,
                w: alignment.w,
                h: alignment.h,
                static: !alignment.static,
              },
            }
          : { block, alignment };
      }
    );

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
    (index: number, itemValue: SetStateAction<BlockListValue>) => {
      const current = value.blocks[index]?.block as BlockValue | null;
      if (!current) {
        return;
      }

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
      <FlexGrid>
        <GridLayoutStyled
          onResizeStop={layout => handleLayoutChange(layout as FlexAlignment[])}
          onDrop={layout => handleLayoutChange(layout as FlexAlignment[])}
          resizeHandles={['se']}
          onDragStop={layout => {
            setIsDragging(false);
            handleLayoutChange(layout as FlexAlignment[]);
          }}
          onDrag={() => setIsDragging(true)} // buggy behavior with onDragStart with double click
          cols={12}
          rowHeight={FLEX_TILE_ROW_HEIGHT}
          containerPadding={[0, 0]}
          draggableCancel={FLEX_TILE_DRAG_CANCEL}
          layout={blocks.map(ft => ft.alignment) as FlexAlignment[]}
        >
          {blocks.map((block, index) => (
            <div
              key={block.alignment.i}
              data-is-editing={
                isEditModalOpen && index === editIndex ? 'true' : 'false'
              }
            >
              <FlexItem
                block={block.block}
                locked={!!block.alignment.static}
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
                onRemoveTile={() => handleRemoveNestedBlock(block.alignment.i)}
                onToggleLock={() => handlePinNestedBlock(block.alignment.i)}
              />
            </div>
          ))}
        </GridLayoutStyled>
      </FlexGrid>

      <AddTileBar>
        <Button
          variant="text"
          startIcon={<MdAdd />}
          onClick={handleAddNestedBlock}
        >
          {t('blocks.flexBlock.addNestedBlock')}
        </Button>
      </AddTileBar>
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.xs,
              maxWidth: '100vw',
            },
          },
        }}
        open={isChooseModalOpen}
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

          if (!currentBlock) {
            return null;
          }

          return (
            <NestedBlockEditPanel aria-labelledby={nestedBlockTitleId}>
              <NestedBlockEditHeader>
                <NestedBlockEditTitle
                  id={nestedBlockTitleId}
                  variant="subtitle2"
                >
                  {blockMap[currentBlock.type].icon}
                  {t(blockMap[currentBlock.type].label)}
                </NestedBlockEditTitle>

                <NestedBlockEditActions>
                  <IconButtonTooltip
                    caption={
                      currentBlock.value.disabled ?
                        t('blockList.showBlock')
                      : t('blockList.hideBlock')
                    }
                  >
                    <MuiIconButton
                      size="small"
                      aria-label={
                        currentBlock.value.disabled ?
                          t('blockList.showBlock')
                        : t('blockList.hideBlock')
                      }
                      onClick={() =>
                        handleItemChange(editIndex, block => ({
                          ...block,
                          value: {
                            ...block.value,
                            disabled: !block.value.disabled,
                          },
                        }))
                      }
                    >
                      {currentBlock.value.disabled ?
                        <MdVisibilityOff />
                      : <MdVisibility />}
                    </MuiIconButton>
                  </IconButtonTooltip>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClose}
                  >
                    {t('blocks.flexBlock.close')}
                  </Button>
                </NestedBlockEditActions>
              </NestedBlockEditHeader>

              <NestedBlockEditBody>
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
              </NestedBlockEditBody>
            </NestedBlockEditPanel>
          );
        })()}
    </>
  );
}

interface FlexItemProps {
  block: BlockValue | null | undefined;
  locked: boolean;
  onEdit: () => void;
  onChoose: () => void;
  onRemove: () => void;
  onRemoveTile: () => void;
  onToggleLock: () => void;
}

export const isBlockValue = (obj: unknown): obj is BlockValue => {
  return (
    !!obj &&
    typeof obj === 'object' &&
    ['type', 'key', 'value'].every(prop => prop in obj)
  );
};
