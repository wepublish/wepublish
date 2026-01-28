import styled from '@emotion/styled';
import arrayMove from 'array-move';
import nanoid from 'nanoid';
import React from 'react';
import { MdAddCircle, MdDelete, MdDragIndicator } from 'react-icons/md';
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
} from 'react-sortable-hoc';
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

const DragHandle = SortableHandle<{ disabled?: boolean }>(
  ({ disabled }: { disabled?: boolean }) => (
    <IconButton
      icon={<MdDragIndicator />}
      disabled={disabled}
    />
  )
);

const ListItem = SortableElement<ListItemProps>(
  ({
    value,
    itemIndex,
    itemDisabled,
    onChange,
    onRemove,
    children,
  }: ListItemProps) => {
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
      <ListItemWrapper>
        <DragHandleWrapper>
          <DragHandle disabled={itemDisabled} />
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
);

const SortableList = SortableContainer<ListFieldProps>(
  ({ value, defaultValue, disabled, children, onChange }: ListFieldProps) => {
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
      onChange(value => [...value, { id: nanoid(), value: defaultValue }]);
    }

    function handleRemove(itemIndex: number) {
      onChange(value => value.filter((_, index) => index !== itemIndex));
    }

    return (
      <div>
        {value.map((value: any, index: number) => (
          <ListItem
            key={value.id}
            itemIndex={index}
            index={index}
            value={value}
            itemDisabled={disabled}
            onChange={handleItemChange}
            onRemove={handleRemove}
          >
            {children}
          </ListItem>
        ))}
        <IconButton
          icon={<MdAddCircle />}
          onClick={handleAdd}
          disabled={disabled}
          data-testid="addProperty"
        />
      </div>
    );
  }
);

export function ListInput<T>({
  value,
  label,
  defaultValue,
  disabled,
  children,
  onChange,
}: ListFieldProps<T>) {
  const onSortEnd = ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    onChange(arrayMove(value, oldIndex, newIndex));
  };

  return (
    <div>
      {label && <label>{label}</label>}
      <SortableList
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        children={children} // eslint-disable-line react/no-children-prop
        onChange={onChange}
        onSortEnd={onSortEnd}
        useDragHandle
      />
    </div>
  );
}
