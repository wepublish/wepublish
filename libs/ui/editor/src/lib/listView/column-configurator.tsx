import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from '@emotion/styled';
import {
  Button,
  Checkbox,
  Divider,
  IconButton,
  ListItemText,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MdDragIndicator } from 'react-icons/md';
import { TbColumns } from 'react-icons/tb';

import { ClickMenu } from '../popover/click-menu';

export type ColumnConfiguratorColumn = {
  id: string;
  label: string;
  canHide?: boolean;
};

export const ToolbarCount = styled.span`
  margin-left: ${({ theme }) => theme.spacing(0.75)};
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: inline-grid;
  place-items: center;
  border-radius: 9px;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1;
  background-color: rgba(
    ${({ theme }) => theme.vars.palette.primary.mainChannel} / 0.16
  );
  color: ${({ theme }) => theme.vars.palette.primary.main};
`;

const MENU_WIDTH = 260;

const DragHandle = styled(IconButton)`
  margin-right: ${({ theme }) => theme.spacing(0.5)};
  margin-left: ${({ theme }) => theme.spacing(-1)};
  color: ${({ theme }) => theme.vars.palette.text.disabled};
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

type ColumnRowProps = {
  column: ColumnConfiguratorColumn;
  checked: boolean;
  sortable: boolean;
  onToggle: (id: string) => void;
};

const ColumnRow = ({ column, checked, sortable, onToggle }: ColumnRowProps) => {
  const canHide = column.canHide ?? true;
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, disabled: !sortable });

  return (
    <MenuItem
      ref={setNodeRef}
      role="menuitemcheckbox"
      aria-checked={checked}
      aria-disabled={!canHide}
      onClick={() => canHide && onToggle(column.id)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
        position: 'relative',
      }}
    >
      {sortable && (
        <DragHandle
          ref={setActivatorNodeRef}
          size="small"
          disableRipple
          aria-label={t('columnConfigurator.dragToReorder')}
          onClick={event => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <MdDragIndicator />
        </DragHandle>
      )}

      <Checkbox
        size="small"
        checked={checked}
        disabled={!canHide}
        tabIndex={-1}
        disableRipple
        slotProps={{ input: { 'aria-hidden': true, tabIndex: -1 } }}
        sx={{ p: 0, mr: 1.5 }}
      />

      <ListItemText primary={column.label} />
    </MenuItem>
  );
};

export type ColumnConfiguratorProps = {
  columns: ReadonlyArray<ColumnConfiguratorColumn>;
  isVisible: (id: string) => boolean;
  onToggle: (id: string) => void;
  onMove?: (id: string, before: string) => void;
  onReset?: () => void;
  canReset?: boolean;
  title?: string;
};

export const ColumnConfigurator = ({
  columns,
  isVisible,
  onToggle,
  onMove,
  onReset,
  canReset,
  title,
}: ColumnConfiguratorProps) => {
  const { t } = useTranslation();
  const label = title ?? t('columnConfigurator.title');
  const hiddenCount = columns.filter(column => !isVisible(column.id)).length;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      onMove?.(String(active.id), String(over.id));
    }
  };

  if (!columns.length) {
    return null;
  }

  return (
    <ClickMenu
      slotProps={{
        list: { dense: true, sx: { minWidth: MENU_WIDTH } },
      }}
      trigger={
        <Button
          size="small"
          color="inherit"
          startIcon={<TbColumns />}
          sx={{ color: 'text.secondary' }}
        >
          {label}
          {hiddenCount > 0 && <ToolbarCount>{hiddenCount}</ToolbarCount>}
        </Button>
      }
    >
      {close =>
        [
          <DndContext
            key="columns"
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map(column => column.id)}
              strategy={verticalListSortingStrategy}
            >
              {columns.map(column => (
                <ColumnRow
                  key={column.id}
                  column={column}
                  checked={isVisible(column.id)}
                  sortable={!!onMove}
                  onToggle={onToggle}
                />
              ))}
            </SortableContext>
          </DndContext>,
          onReset && <Divider key="divider" />,
          onReset && (
            <MenuItem
              key="reset"
              aria-disabled={!canReset}
              disabled={!canReset}
              onClick={() => {
                onReset();
                close();
              }}
            >
              <ListItemText primary={t('columnConfigurator.reset')} />
            </MenuItem>
          ),
        ].filter(Boolean)
      }
    </ClickMenu>
  );
};
