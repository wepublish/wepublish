import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from '@emotion/styled';
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import {
  bindComponent,
  useArrayField,
  useObjectField,
  useUnionField,
  type ChildOverride,
} from '@wepublish/form/core';
import { useId, useRef, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { MdAdd, MdDelete, MdDragIndicator } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

import { FieldDescription } from '../field-anatomy';
import { DiscriminatorField } from './discriminator-field';
import {
  FieldGroup,
  groupTitleId,
  hasGroupTitle,
  inheritedFlags,
} from './field-group';

export type ArrayFieldVariant = 'list' | 'table';

export type ArrayFieldProps = {
  variant?: ArrayFieldVariant;
  sortable?: boolean;
  addLabel?: ReactNode;
};

const Rows = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};

  & + & {
    padding-top: ${({ theme }) => theme.spacing(2)};
    border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
  }
`;

const RowContent = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const Cell = styled(TableCell)`
  vertical-align: middle;
`;

type RowActionsProps = {
  index: number;
  disabled: boolean;
  listId: string;
  onRemove: (index: number) => void;
};

function RowActions({ index, disabled, listId, onRemove }: RowActionsProps) {
  const { t } = useTranslation();

  return (
    <Actions>
      <IconButton
        size="small"
        color="error"
        aria-label={t('form.array.remove', { position: index + 1 })}
        data-array-remove={listId}
        disabled={disabled}
        onClick={() => onRemove(index)}
      >
        <MdDelete />
      </IconButton>
    </Actions>
  );
}

type RowFrameProps = {
  id: string;
  index: number;
  table: boolean;
  disabled: boolean;
  children: (handle: ReactNode) => ReactNode;
};

function StaticRowFrame({ table, children }: RowFrameProps) {
  return table ?
      <TableRow>{children(null)}</TableRow>
    : <Row>{children(null)}</Row>;
}

function SortableRowFrame({
  id,
  index,
  table,
  disabled,
  children,
}: RowFrameProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
    attributes: { roleDescription: t('form.array.roleDescription') },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative' as const,
    zIndex: isDragging ? 1 : undefined,
  };
  const handle = (
    <IconButton
      ref={setActivatorNodeRef}
      size="small"
      disabled={disabled}
      {...attributes}
      {...listeners}
      aria-label={t('form.array.dragHandle', { position: index + 1 })}
      sx={{ cursor: disabled ? undefined : 'grab', touchAction: 'none' }}
    >
      <MdDragIndicator />
    </IconButton>
  );

  return table ?
      <TableRow
        ref={setNodeRef}
        style={style}
      >
        {children(handle)}
      </TableRow>
    : <Row
        ref={setNodeRef}
        style={style}
      >
        {children(handle)}
      </Row>;
}

type SortableRowsProps = {
  ids: string[];
  onMove: (from: number, to: number) => void;
  children: ReactNode;
};

function SortableRows({ ids, onMove, children }: SortableRowsProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const position = (id: UniqueIdentifier) => ids.indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t('form.array.dragStart', { position: position(active.id) }),
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id ?
        t('form.array.dragOver', {
          position: position(active.id),
          target: position(over.id),
        })
      : undefined,
    onDragEnd: ({ active, over }) =>
      over ?
        t('form.array.dragEnd', {
          position: position(active.id),
          target: position(over.id),
        })
      : t('form.array.dragCancel', { position: position(active.id) }),
    onDragCancel: ({ active }) =>
      t('form.array.dragCancel', { position: position(active.id) }),
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));

    if (from >= 0 && to >= 0) {
      onMove(from, to);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={onDragEnd}
      accessibility={{
        container: document.body,
        announcements,
        screenReaderInstructions: {
          draggable: t('form.array.dragInstructions'),
        },
      }}
    >
      <SortableContext
        items={ids}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}

type ItemCellsProps = {
  keys: readonly string[];
};

function UnionCells({ keys }: ItemCellsProps) {
  const union = useUnionField();
  const row = useObjectField();
  const child: ChildOverride = { ...inheritedFlags(row), hideLabel: true };
  const discriminator = bindComponent(DiscriminatorField, {
    control: 'select',
  });

  return keys.map(key => (
    <Cell key={key}>
      {row.renderField(
        key,
        key === union.discriminator ?
          { ...child, component: discriminator }
        : child
      )}
    </Cell>
  ));
}

function ItemCells({ keys }: ItemCellsProps) {
  const row = useObjectField();
  const child: ChildOverride = { ...inheritedFlags(row), hideLabel: true };

  if (row.kind === 'discriminatedUnion') {
    return <UnionCells keys={keys} />;
  }

  if (row.kind !== 'object') {
    throw new Error(
      `ArrayField variant="table" needs object or discriminated-union items, but "${row.name}" is of kind "${row.kind}".`
    );
  }

  return keys.map(key => <Cell key={key}>{row.renderField(key, child)}</Cell>);
}

export function ArrayField({
  variant = 'list',
  sortable = true,
  addLabel,
}: ArrayFieldProps) {
  const { t } = useTranslation();
  const list = useArrayField();
  const addRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const editable = !list.readOnly;
  const full =
    list.info.maxLength !== undefined && list.count >= list.info.maxLength;
  const child = inheritedFlags(list);
  const keys = list.itemKeys.map(item => item.key);
  const hasTitle = hasGroupTitle(list);

  const reorderable = sortable && editable;
  const Frame = reorderable ? SortableRowFrame : StaticRowFrame;

  const remove = (index: number) => {
    flushSync(() => list.remove(index));

    const removeButtons = document.querySelectorAll<HTMLButtonElement>(
      `[data-array-remove="${listId}"]`
    );
    const next = removeButtons[Math.min(index, removeButtons.length - 1)];

    (next ?? addRef.current)?.focus();
  };

  const actions = (index: number) =>
    editable ?
      <RowActions
        index={index}
        disabled={list.disabled}
        listId={listId}
        onRemove={remove}
      />
    : null;

  const rows = list.items.map(item => (
    <Frame
      key={item.key}
      id={item.key}
      index={item.index}
      table={variant === 'table'}
      disabled={list.disabled}
    >
      {handle =>
        variant === 'table' ?
          <>
            {reorderable ?
              <Cell>{handle}</Cell>
            : null}
            {list.renderItem(item.index, {
              ...child,
              component: bindComponent(ItemCells, { keys }),
            })}
            {editable ?
              <Cell>{actions(item.index)}</Cell>
            : null}
          </>
        : <>
            {handle}
            <RowContent>{list.renderItem(item.index, child)}</RowContent>
            {actions(item.index)}
          </>
      }
    </Frame>
  ));

  const body =
    reorderable ?
      <SortableRows
        ids={list.items.map(item => item.key)}
        onMove={list.move}
      >
        {rows}
      </SortableRows>
    : rows;

  const items =
    variant === 'table' ?
      <TableContainer sx={{ position: 'relative' }}>
        <Table
          size="small"
          aria-labelledby={hasTitle ? groupTitleId(list) : undefined}
          aria-label={
            !hasTitle && typeof list.label === 'string' ? list.label : undefined
          }
        >
          <TableHead>
            <TableRow>
              {reorderable ?
                <Cell>
                  <Box
                    component="span"
                    sx={visuallyHidden}
                  >
                    {t('form.array.reorder')}
                  </Box>
                </Cell>
              : null}
              {list.itemKeys.map(item => (
                <Cell key={item.key}>
                  {item.label}
                  <FieldDescription description={item.description} />
                </Cell>
              ))}
              {editable ?
                <Cell>
                  <Box
                    component="span"
                    sx={visuallyHidden}
                  >
                    {t('form.array.actions')}
                  </Box>
                </Cell>
              : null}
            </TableRow>
          </TableHead>
          <TableBody>{body}</TableBody>
        </Table>
      </TableContainer>
    : <Rows>{body}</Rows>;

  return (
    <FieldGroup
      field={list}
      showRequired
    >
      {list.count === 0 ?
        <Typography
          variant="body2"
          color="textSecondary"
        >
          {t('form.array.empty')}
        </Typography>
      : items}
      {editable ?
        <Button
          ref={addRef}
          variant="text"
          size="small"
          startIcon={<MdAdd />}
          disabled={list.disabled || full}
          onClick={() => list.append()}
          sx={{ justifySelf: 'start' }}
        >
          {addLabel === undefined ?
            t('form.array.add')
          : typeof addLabel === 'string' ?
            t(addLabel)
          : addLabel}
        </Button>
      : null}
    </FieldGroup>
  );
}
