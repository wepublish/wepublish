import {
  Announcements,
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from '@emotion/styled';
import { Button, IconButton } from '@mui/material';
import nanoid from 'nanoid';
import { Dispatch, JSX, SetStateAction, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdContentCopy,
  MdDelete,
  MdDragIndicator,
} from 'react-icons/md';

import { generateID, isFunctionalUpdate } from '../utility';
import { IconButtonTooltip } from './iconButtonTooltip';

const IconButtonWrapper = styled.div`
  flex-shrink: 0;
`;

const ChildrenWrapper = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  min-height: 100%;
  display: flex;

  > * {
    flex: 1 1 auto;
    min-width: 0;
  }
`;

const DragHandleWrapper = styled.div`
  flex-shrink: 0;
`;

const RowIndex = styled.span`
  flex-shrink: 0;
  min-width: 2ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const List = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const ListItemWrapper = styled.li<{ dense?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ dense }) => (dense ? '4px' : '8px')};
  margin-bottom: ${({ dense }) => (dense ? '4px' : '8px')};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export interface FieldProps<V = any> {
  value: V;
  onChange: Dispatch<SetStateAction<V>>;
}

export interface ListFieldProps<T = any> {
  value: ListValue<T>[];
  // Always receives the new list, never an updater function, so react-hook-form's
  // field.onChange can be passed as well as a state setter.
  onChange: (value: ListValue<T>[]) => void;
  label?: string;
  defaultValue?: T;
  disabled?: boolean;
  showIndex?: boolean;
  dense?: boolean;
  addLabel?: string;
  onAdd?: () => void;
  duplicateLastLabel?: string;
  duplicateValue?: (value: T) => T;
  maxItems?: number;
  children: (props: FieldProps<T>) => JSX.Element;
}

export interface ListValue<T = any> {
  id: string;
  value: T;
}

export function useListInputState<T>(
  initialValues: T[],
  onCommit: (values: T[]) => void
): [ListValue<T>[], Dispatch<SetStateAction<ListValue<T>[]>>] {
  const [items, setItems] = useState<ListValue<T>[]>(() =>
    initialValues.map(value => ({ id: generateID(), value }))
  );

  const handleChange = useCallback(
    (update: SetStateAction<ListValue<T>[]>) => {
      const nextItems = isFunctionalUpdate(update) ? update(items) : update;

      setItems(nextItems);
      onCommit(nextItems.map(({ value }) => value));
    },
    [items, onCommit]
  );

  return [items, handleChange];
}

export interface ListItemProps<T = any> {
  value: ListValue<T>;
  itemIndex: number;
  itemDisabled?: boolean;
  showIndex?: boolean;
  dense?: boolean;
  onChange: (index: number, value: SetStateAction<ListValue<T>>) => void;
  onRemove: (index: number) => void;
  children: (props: FieldProps<T>) => JSX.Element;
}

function ListItem({
  value,
  itemIndex,
  itemDisabled,
  showIndex,
  dense,
  onChange,
  onRemove,
  children,
}: ListItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value.id, disabled: itemDisabled });

  function handleValueChange(fieldValue: SetStateAction<any>) {
    onChange(itemIndex, value => ({
      ...value,
      value:
        isFunctionalUpdate(fieldValue) ? fieldValue(value.value) : fieldValue,
    }));
  }

  function handleRemove() {
    onRemove(itemIndex);
  }

  return (
    <ListItemWrapper
      ref={setNodeRef}
      dense={dense}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
        position: 'relative',
      }}
    >
      <DragHandleWrapper>
        <IconButtonTooltip caption={t('listInput.dragToReorder')}>
          <IconButton
            ref={setActivatorNodeRef}
            size="small"
            {...attributes}
            {...listeners}
            aria-label={t('listInput.dragToReorder')}
            disabled={itemDisabled}
          >
            <MdDragIndicator />
          </IconButton>
        </IconButtonTooltip>
      </DragHandleWrapper>

      {showIndex && (
        <RowIndex data-testid="list-input-index">{itemIndex + 1}</RowIndex>
      )}

      <ChildrenWrapper>
        {children({ value: value.value, onChange: handleValueChange })}
      </ChildrenWrapper>

      <IconButtonWrapper>
        <IconButtonTooltip caption={t('delete')}>
          <IconButton
            size="small"
            color="error"
            aria-label={t('delete')}
            onClick={handleRemove}
            disabled={itemDisabled}
          >
            <MdDelete />
          </IconButton>
        </IconButtonTooltip>
      </IconButtonWrapper>
    </ListItemWrapper>
  );
}

export function ListInput<T>({
  value,
  label,
  defaultValue,
  disabled,
  showIndex,
  dense,
  addLabel,
  onAdd,
  duplicateLastLabel,
  duplicateValue,
  maxItems,
  children,
  onChange,
}: ListFieldProps<T>) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const positionOf = (id: UniqueIdentifier) =>
    value.findIndex(item => item.id === id) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t('listInput.announcements.start', {
        position: positionOf(active.id),
        total: value.length,
      }),
    onDragOver: ({ over }) =>
      over ?
        t('listInput.announcements.over', {
          position: positionOf(over.id),
          total: value.length,
        })
      : undefined,
    onDragEnd: ({ over }) =>
      over ?
        t('listInput.announcements.end', {
          position: positionOf(over.id),
          total: value.length,
        })
      : t('listInput.announcements.cancel'),
    onDragCancel: () => t('listInput.announcements.cancel'),
  };

  const canAdd = maxItems == null || value.length < maxItems;

  function handleItemChange(
    itemIndex: number,
    itemValue: SetStateAction<ListValue>
  ) {
    onChange(
      Object.assign([], value, {
        [itemIndex]:
          isFunctionalUpdate(itemValue) ?
            itemValue(value[itemIndex])
          : itemValue,
      })
    );
  }

  function handleAdd() {
    if (onAdd) {
      onAdd();
      return;
    }

    onChange([...value, { id: nanoid(), value: defaultValue as T }]);
  }

  function handleDuplicateLast() {
    const last = value[value.length - 1];

    if (!last) {
      return;
    }

    onChange([
      ...value,
      {
        id: nanoid(),
        value:
          duplicateValue ?
            duplicateValue(last.value)
          : structuredClone(last.value),
      },
    ]);
  }

  function handleRemove(itemIndex: number) {
    onChange(value.filter((_, index) => index !== itemIndex));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = value.findIndex(item => item.id === active.id);
    const newIndex = value.findIndex(item => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onChange(arrayMove(value, oldIndex, newIndex));
  }

  return (
    <div>
      {label && <label>{label}</label>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable: t('listInput.announcements.instructions'),
          },
        }}
      >
        <SortableContext
          items={value.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <List>
            {value.map((itemValue, index) => (
              <ListItem
                key={itemValue.id}
                itemIndex={index}
                value={itemValue}
                itemDisabled={disabled}
                showIndex={showIndex}
                dense={dense}
                onChange={handleItemChange}
                onRemove={handleRemove}
              >
                {children}
              </ListItem>
            ))}
          </List>
        </SortableContext>
      </DndContext>

      {canAdd && (
        <Actions>
          <Button
            variant="text"
            startIcon={<MdAdd />}
            onClick={handleAdd}
            disabled={disabled}
            data-testid="addProperty"
          >
            {addLabel ?? t('listInput.add')}
          </Button>

          {duplicateLastLabel && value.length > 0 && (
            <Button
              variant="text"
              startIcon={<MdContentCopy />}
              onClick={handleDuplicateLast}
              disabled={disabled}
            >
              {duplicateLastLabel}
            </Button>
          )}
        </Actions>
      )}
    </div>
  );
}
