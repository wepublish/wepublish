import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import styled from '@emotion/styled';
import {
  Button,
  Card,
  Drawer,
  IconButton as MuiIconButton,
  Stack,
} from '@mui/material';
import nanoid from 'nanoid';
import {
  ChangeEvent,
  ComponentType,
  PropsWithChildren,
  useEffect,
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
} from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import {
  FLEX_TILE_DRAG_CANCEL,
  FLEX_TILE_ROW_HEIGHT,
  FlexGrid,
  FlexTile,
  FlexTileAction,
} from '../atoms/flexTile';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { DRAWER_WIDTHS } from '../drawer';
import { TeaserEditPanel } from '../panel/teaserEditPanel';
import { TeaserSelectAndEditPanel } from '../panel/teaserSelectAndEditPanel';
import { ContentForTeaser } from './teaserGridBlock';
import {
  FlexAlignment,
  FlexTeaser,
  Teaser as TeaserType,
  TeaserGridFlexBlockValue,
} from './types';

const IconButton = styled(MuiIconButton)`
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
  WidthProvider(GridLayoutWithoutChildren);

const AddTileBar = styled('div')`
  display: flex;
  margin-block: ${({ theme }) => theme.spacing(1)};
`;

const ButtonToolbar = styled(Stack)`
  top: 0;
  left: 0;
  position: absolute;
`;

const Panel = styled(Card, {
  shouldForwardProp: prop => prop !== 'showGrabCursor',
})<{ showGrabCursor: boolean }>`
  display: grid;
  cursor: ${({ showGrabCursor }) => showGrabCursor && 'grab'};
  height: inherit;
  overflow: hidden;
  z-index: 1;
`;

export function FlexTeaserBlock({
  teaser,
  locked,
  onEdit,
  onChoose,
  onRemove,
  onRemoveTile,
  onToggleLock,
}: FlexTeaserBlockProps) {
  const { t } = useTranslation();

  const actions: FlexTileAction[] = [
    ...(teaser ?
      [
        {
          label: t('blocks.flexTeaser.chooseTeaser'),
          icon: <MdArticle />,
          onClick: onChoose,
        },
        {
          label: t('blocks.flexTeaser.editTeaser'),
          icon: <MdEdit />,
          onClick: onEdit,
        },
        {
          label: t('blocks.flexTeaser.deleteTeaser'),
          icon: <MdDelete />,
          onClick: onRemove,
        },
      ]
    : [
        {
          label: t('blocks.flexTeaser.removeBlock'),
          icon: <MdDelete />,
          onClick: onRemoveTile,
          disabled: locked,
        },
      ]),
    {
      label:
        locked ?
          t('blocks.flexTeaser.unlockBlock')
        : t('blocks.flexTeaser.lockBlock'),
      icon: locked ? <MdLockOpen /> : <MdLock />,
      onClick: onToggleLock,
    },
  ];

  return (
    <FlexTile
      locked={locked}
      empty={!teaser}
      actions={actions}
    >
      {teaser ?
        <Teaser>
          <ContentForTeaser teaser={teaser} />
        </Teaser>
      : <PlaceholderInput
          onAddClick={onChoose}
          addLabel={t('blocks.flexTeaser.chooseTeaser')}
          minHeight={0}
        />
      }
    </FlexTile>
  );
}

export function TeaserGridFlexBlock({
  value,
  onChange,
}: BlockProps<TeaserGridFlexBlockValue>) {
  const [editItem, setEditItem] = useState<FlexTeaser>();

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { flexTeasers } = value;

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

  // Teaser Block functions: add, remove, layout change, pin
  const handleAddTeaserBlock = () => {
    const newTeaser: FlexTeaser = {
      alignment: {
        i: nanoid(),
        x: 0,
        y: 0,
        w: 4,
        h: 4,
        static: false,
      },
      teaser: null,
    };
    onChange({ ...value, flexTeasers: [...flexTeasers, newTeaser] });
  };

  const handleRemoveTeaserBlock = (index: string) => {
    onChange({
      ...value,
      flexTeasers: flexTeasers.filter(
        flexTeaser => flexTeaser.alignment.i !== index
      ),
    });
  };

  const handleLayoutChange = (layout: FlexAlignment[]) => {
    const newFlexTeasers = layout.map(v => {
      return {
        teaser:
          flexTeasers.find(flexTeaser => v.i === flexTeaser.alignment.i)
            ?.teaser ?? null,
        alignment: v,
      };
    });
    onChange({ ...value, flexTeasers: newFlexTeasers });
  };

  const handlePinTeaserBlock = (index: string) => {
    const newTeasers = flexTeasers.map(({ teaser, alignment }) => {
      return alignment.i === index ?
          {
            teaser,
            alignment: {
              i: alignment.i,
              x: alignment.x,
              y: alignment.y,
              w: alignment.w,
              h: alignment.h,
              static: !alignment.static,
            },
          }
        : { teaser, alignment };
    });
    onChange({ ...value, flexTeasers: newTeasers });
  };

  // Teaser functions: change, remove
  function handleTeaserLinkChange(
    index: string,
    teaserLink: TeaserType | null
  ) {
    onChange({
      ...value,
      flexTeasers: flexTeasers.map(ft => {
        return ft.alignment.i === index ?
            { alignment: ft.alignment, teaser: teaserLink }
          : ft;
      }),
    });
  }

  function handleRemoveTeaser(index: string) {
    onChange({
      ...value,
      flexTeasers: flexTeasers.map(({ teaser, alignment }) => {
        return alignment.i === index ?
            { alignment, teaser: null }
          : { teaser, alignment };
      }),
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

      <FlexGrid>
        <GridLayout
          onResizeStop={layout => handleLayoutChange(layout as FlexAlignment[])}
          onDrop={layout => handleLayoutChange(layout as FlexAlignment[])}
          onDragStop={layout => {
            setIsDragging(false);
            handleLayoutChange(layout as FlexAlignment[]);
          }}
          onDrag={() => setIsDragging(true)} // buggy behavior with onDragStart with double click
          cols={12}
          rowHeight={FLEX_TILE_ROW_HEIGHT}
          compactType={null}
          containerPadding={[0, 0]}
          draggableCancel={FLEX_TILE_DRAG_CANCEL}
          layout={flexTeasers.map(ft => ft.alignment)}
        >
          {flexTeasers.map(flexTeaser => (
            <div key={flexTeaser.alignment.i}>
              <FlexTeaserBlock
                teaser={flexTeaser.teaser}
                locked={!!flexTeaser.alignment.static}
                onEdit={() => {
                  setEditItem(flexTeaser);
                  setEditModalOpen(true);
                }}
                onChoose={() => {
                  setEditItem(flexTeaser);
                  setChooseModalOpen(true);
                }}
                onRemove={() => handleRemoveTeaser(flexTeaser.alignment.i)}
                onRemoveTile={() =>
                  handleRemoveTeaserBlock(flexTeaser.alignment.i)
                }
                onToggleLock={() =>
                  handlePinTeaserBlock(flexTeaser.alignment.i)
                }
              />
            </div>
          ))}
        </GridLayout>
      </FlexGrid>

      <AddTileBar>
        <Button
          variant="text"
          startIcon={<MdAdd />}
          onClick={handleAddTeaserBlock}
        >
          {t('blocks.flexTeaser.addBlock')}
        </Button>
      </AddTileBar>

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
        {editItem?.teaser && (
          <TeaserEditPanel
            key={editItem.alignment.i}
            initialTeaser={editItem.teaser}
            onClose={() => setEditModalOpen(false)}
            onConfirm={teaser => {
              setEditModalOpen(false);
              handleTeaserLinkChange(editItem.alignment.i, teaser);
            }}
          />
        )}
      </Drawer>
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
        open={isChooseModalOpen}
        onClose={() => setChooseModalOpen(false)}
      >
        <TeaserSelectAndEditPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={teaser => {
            setChooseModalOpen(false);
            if (editItem?.alignment.i) {
              handleTeaserLinkChange(editItem.alignment.i, teaser);
            }
          }}
        />
      </Drawer>
    </>
  );
}

interface FlexTeaserBlockProps {
  teaser: TeaserType | null;
  locked: boolean;
  onEdit: () => void;
  onChoose: () => void;
  onRemove: () => void;
  onRemoveTile: () => void;
  onToggleLock: () => void;
}
