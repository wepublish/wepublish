import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
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
import {
  AutoField,
  Field,
  FieldLabel,
  FieldProps,
  IconButton,
} from '@puckeditor/core';

import { ListField, ListValue } from './list.field';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdDragIndicator } from 'react-icons/md';

// Mirrors the look of Puck's built-in array field (see ArrayField styles in
// @puckeditor/core) so both list types feel the same in the sidebar.
const Wrapper = styled.div`
  --_list-border-color: var(
    --puck-field-color-border,
    var(--puck-color-border)
  );
  --_list-border-width: var(
    --puck-field-border-width,
    var(--puck-border-width-regular)
  );
  --_list-radius: var(--puck-field-radius, var(--puck-radius-m));
  --_list-radius-inner: calc(var(--_list-radius) - var(--_list-border-width));

  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(
    --puck-field-color-bg-active,
    var(--puck-color-interactive-soft)
  );
  border: var(--_list-border-width) solid var(--_list-border-color);
  border-radius: var(--_list-radius);
`;

const ItemRow = styled.div<{ dragging: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--puck-space-1);
  padding: var(--puck-field-space-y, var(--puck-space-3))
    var(--puck-field-space-x, var(--puck-space-4));
  background: var(--puck-field-color-bg, var(--puck-color-surface));
  color: var(--puck-field-color-text, var(--puck-color-text));
  position: relative;
  z-index: ${({ dragging }) => (dragging ? 1 : 'auto')};
  outline: ${({ dragging }) =>
    dragging ?
      'var(--puck-border-width-focus) solid var(--puck-field-color-border-dragging, var(--puck-color-selection-border))'
    : 'none'};

  & + & {
    border-top: var(--_list-border-width) solid var(--_list-border-color);
  }

  &:first-of-type {
    border-top-left-radius: var(--_list-radius-inner);
    border-top-right-radius: var(--_list-radius-inner);
  }
`;

const DragHandle = styled.button`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: var(--puck-space-1);
  margin: 0;
  border: 0;
  border-radius: var(--puck-radius-m);
  background: transparent;
  color: var(--puck-color-text-secondary);
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
  }
`;

const ItemField = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemActions = styled.div`
  display: flex;
  flex-shrink: 0;
  color: var(--puck-color-text-secondary);
  opacity: 0;
  transition: opacity var(--puck-duration-fast) var(--puck-ease-exit);

  ${ItemRow}:hover &,
  ${ItemRow}:focus-within & {
    opacity: 1;
  }
`;

const AddButton = styled.button<{ hasItems: boolean }>`
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0;
  padding: calc(var(--puck-field-space-y, var(--puck-space-3)) + 2px)
    var(--puck-field-space-x, var(--puck-space-4));
  border: 0;
  border-top: ${({ hasItems }) =>
    hasItems ?
      'var(--_list-border-width) solid var(--_list-border-color)'
    : 'none'};
  border-radius: ${({ hasItems }) =>
    hasItems ?
      '0 0 var(--_list-radius-inner) var(--_list-radius-inner)'
    : 'var(--_list-radius-inner)'};
  background: var(--puck-field-color-bg, var(--puck-color-surface));
  color: var(--puck-field-array-add-color-icon, var(--puck-color-interactive));
  cursor: pointer;
  transition: background-color var(--puck-duration-fast) var(--puck-ease-exit);

  &:hover:not(:disabled),
  &:active:not(:disabled) {
    background: var(
      --puck-field-color-bg-hover,
      var(--puck-color-interactive-soft-hover)
    );
    color: var(--puck-field-color-text-hover, var(--puck-color-text));
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: calc(var(--puck-border-width-focus) * -1);
  }
`;

const resolveDefaultItem = <Item,>(
  defaultItem: ListField<Item>['defaultItem'],
  index: number
): Item => {
  return typeof defaultItem === 'function' ?
      (defaultItem as (index: number) => Item)(index)
    : (defaultItem as Item);
};

// Values are plain primitives and may repeat, so sorting needs a stable id
// per position that survives reorders and edits.
const useItemIds = (length: number) => {
  const ids = useRef<string[]>([]);
  const counter = useRef(0);

  while (ids.current.length < length) {
    ids.current.push(`item-${counter.current++}`);
  }

  if (ids.current.length > length) {
    ids.current = ids.current.slice(0, length);
  }

  return ids;
};

type SortableItemProps = {
  id: string;
  index: number;
  fieldId?: string;
  itemField: Field;
  value: unknown;
  readOnly?: boolean;
  canRemove: boolean;
  onChange: (value: unknown) => void;
  onRemove: () => void;
};

const SortableItem = ({
  id,
  index,
  fieldId,
  itemField,
  value,
  readOnly,
  canRemove,
  onChange,
  onRemove,
}: SortableItemProps) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: readOnly });

  return (
    <ItemRow
      ref={setNodeRef}
      dragging={isDragging}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <DragHandle
        ref={setActivatorNodeRef}
        type="button"
        title={t('', 'Drag to reorder')}
        disabled={readOnly}
        {...attributes}
        {...listeners}
      >
        <MdDragIndicator size={16} />
      </DragHandle>

      <ItemField>
        <AutoField
          id={fieldId ? `${fieldId}_${index}` : undefined}
          field={itemField}
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      </ItemField>

      <ItemActions>
        <IconButton
          type="button"
          title={t('', 'Remove')}
          disabled={!canRemove}
          onClick={onRemove}
        >
          <MdDelete size={16} />
        </IconButton>
      </ItemActions>
    </ItemRow>
  );
};

export type ListFieldRenderProps<Item> = FieldProps<
  ListField<Item>,
  ListValue<Item>
> & {
  name: string;
  id?: string;
};

export const ListFieldRender = <Item,>({
  field,
  value,
  onChange,
  readOnly,
  id,
}: ListFieldRenderProps<Item>) => {
  const { t } = useTranslation();
  const current = value ?? [];
  const ids = useItemIds(current.length);
  const canAdd =
    !readOnly && (field.max === undefined || current.length < field.max);
  const canRemove =
    !readOnly && (field.min === undefined || current.length > field.min);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addItem = () => {
    onChange([
      ...current,
      resolveDefaultItem(field.defaultItem, current.length),
    ]);
  };

  const removeItem = (index: number) => {
    ids.current = ids.current.filter((_, i) => i !== index);
    onChange(current.filter((_, i) => i !== index));
  };

  const changeItem = (index: number, item: Item) => {
    onChange(current.map((existing, i) => (i === index ? item : existing)));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const from = ids.current.indexOf(String(active.id));
    const to = ids.current.indexOf(String(over.id));

    if (from < 0 || to < 0) {
      return;
    }

    ids.current = arrayMove(ids.current, from, to);
    onChange(arrayMove(current, from, to));
  };

  return (
    <FieldLabel
      label={field.label ?? t('', 'List')}
      readOnly={readOnly}
      el="div"
    >
      <Wrapper>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ids.current}
            strategy={verticalListSortingStrategy}
          >
            {current.map((item, index) => (
              <SortableItem
                key={ids.current[index]}
                id={ids.current[index]}
                index={index}
                fieldId={id}
                itemField={field.itemField as Field}
                value={item}
                readOnly={readOnly}
                canRemove={canRemove}
                onChange={next => changeItem(index, next as Item)}
                onRemove={() => removeItem(index)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <AddButton
          type="button"
          title={t('', 'Add item')}
          hasItems={current.length > 0}
          disabled={!canAdd}
          onClick={addItem}
        >
          <MdAdd size={21} />
        </AddButton>
      </Wrapper>
    </FieldLabel>
  );
};
