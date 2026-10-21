import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from '@emotion/styled';
import { Button, IconButton } from '@mui/material';
import nanoid from 'nanoid';
import { Dispatch, JSX, SetStateAction, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdDragIndicator } from 'react-icons/md';

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

const ListItemWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

export interface FieldProps<V = any> {
  value: V;
  onChange: Dispatch<SetStateAction<V>>;
}

export interface ListFieldProps<T = any> extends FieldProps<ListValue<T>[]> {
  label?: string;
  defaultValue: T | (() => T);
  disabled?: boolean;
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
  onChange: (index: number, value: SetStateAction<ListValue<T>>) => void;
  onRemove: (index: number) => void;
  children: (props: FieldProps<T>) => JSX.Element;
}

function ListItem({
  value,
  itemIndex,
  itemDisabled,
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
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
        position: 'relative',
      }}
    >
      <DragHandleWrapper
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
      >
        <IconButtonTooltip caption={t('listInput.dragToReorder')}>
          <IconButton
            size="small"
            aria-label={t('listInput.dragToReorder')}
            disabled={itemDisabled}
          >
            <MdDragIndicator />
          </IconButton>
        </IconButtonTooltip>
      </DragHandleWrapper>

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
  children,
  onChange,
}: ListFieldProps<T>) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleItemChange(
    itemIndex: number,
    itemValue: SetStateAction<ListValue>
  ) {
    onChange(value =>
      Object.assign([], value, {
        [itemIndex]:
          isFunctionalUpdate(itemValue) ?
            itemValue(value[itemIndex])
          : itemValue,
      })
    );
  }

  function handleAdd() {
    onChange(value => [...value, { id: nanoid(), value: defaultValue as T }]);
  }

  function handleRemove(itemIndex: number) {
    onChange(value => value.filter((_, index) => index !== itemIndex));
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
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={value.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {value.map((itemValue, index) => (
            <ListItem
              key={itemValue.id}
              itemIndex={index}
              value={itemValue}
              itemDisabled={disabled}
              onChange={handleItemChange}
              onRemove={handleRemove}
            >
              {children}
            </ListItem>
          ))}
        </SortableContext>
      </DndContext>
      <Button
        variant="text"
        startIcon={<MdAdd />}
        onClick={handleAdd}
        disabled={disabled}
        data-testid="addProperty"
      >
        {t('listInput.add')}
      </Button>
    </div>
  );
}
