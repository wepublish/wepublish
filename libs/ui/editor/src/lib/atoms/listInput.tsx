import { JSX } from 'react';
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
import nanoid from 'nanoid';
import React from 'react';
import { MdAddCircle, MdDelete, MdDragIndicator } from 'react-icons/md';
import { IconButton, Panel as RPanel } from 'rsuite';

import { isFunctionalUpdate } from '../utility';

const IconButtonWrapper = styled.div`
  margin-left: 10px;
`;

const ChildrenWrapper = styled.div`
  min-height: 100%;
  display: flex;
`;

const Panel = styled(RPanel)`
  width: 100%;
`;

const DragHandleWrapper = styled.div`
  margin-right: 10px;
`;

const ListItemWrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
`;

export interface FieldProps<V = any> {
  readonly value: V;
  readonly onChange: React.Dispatch<React.SetStateAction<V>>;
}

export interface ListFieldProps<T = any> extends FieldProps<ListValue<T>[]> {
  readonly label?: string;
  readonly defaultValue: T | (() => T);
  readonly disabled?: boolean;
  readonly children: (props: FieldProps<T>) => JSX.Element;
}

export interface ListValue<T = any> {
  readonly id: string;
  readonly value: T;
}

export interface ListItemProps<T = any> {
  readonly value: ListValue<T>;
  readonly itemIndex: number;
  readonly itemDisabled?: boolean;
  readonly onChange: (
    index: number,
    value: React.SetStateAction<ListValue<T>>
  ) => void;
  readonly onRemove: (index: number) => void;
  readonly children: (props: FieldProps<T>) => JSX.Element;
}

function ListItem({
  value,
  itemIndex,
  itemDisabled,
  onChange,
  onRemove,
  children,
}: ListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value.id, disabled: itemDisabled });

  function handleValueChange(fieldValue: React.SetStateAction<any>) {
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
        <IconButton
          icon={<MdDragIndicator />}
          disabled={itemDisabled}
        />
      </DragHandleWrapper>
      <Panel bodyFill>
        <ChildrenWrapper>
          {children({ value: value.value, onChange: handleValueChange })}
        </ChildrenWrapper>
      </Panel>
      <IconButtonWrapper>
        <IconButton
          icon={<MdDelete />}
          onClick={handleRemove}
          disabled={itemDisabled}
        />
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleItemChange(
    itemIndex: number,
    itemValue: React.SetStateAction<ListValue>
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
      <IconButton
        icon={<MdAddCircle />}
        onClick={handleAdd}
        disabled={disabled}
        data-testid="addProperty"
      />
    </div>
  );
}
