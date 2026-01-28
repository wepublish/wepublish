import styled from '@emotion/styled';
import {
  BlockStyle,
  EditorBlockType,
  getApiClientV2,
  useBlockStylesQuery,
} from '@wepublish/editor/api-v2';
import nanoid from 'nanoid';
import React, {
  Fragment,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDownward, MdArrowUpward, MdDelete } from 'react-icons/md';
import { IconButton, Panel as RPanel, SelectPicker } from 'rsuite';

import {
  isFunctionalUpdate,
  isValueConstructor,
  UnionToIntersection,
  ValueConstructor,
} from '../utility';
import { AddBlockInput } from './addBlockInput';

export const BlockStyleIconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 10px;
  gap: 8px;
`;

const Icon = styled.div`
  display: flex;
  align-items: center;
  fill: gray;
  gap: 8px;
`;

const BlockStyleSelect = styled(SelectPicker)`
  width: 150px;
`;

const ChildrenWrapper = styled.div`
  padding: 20px;
`;

const Panel = styled(RPanel)`
  width: 100%;
`;

export const PanelWrapper = styled.div`
  display: flex;
  width: 100%;
`;

export const DownwardButtonWrapper = styled.div`
  margin-bottom: 10px;
`;

export const UpwardButtonWrapper = styled.div`
  margin-top: 10px;
  margin-bottom: 5px;
`;

export const FlexGrow = styled.div`
  flex-grow: 1;
`;

export const LeftButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 10px;
`;

export const ListItem = styled.div`
  display: flex;
  width: 100%;
`;

const AddButton = styled.div`
  width: 100%;
`;

const AddBlockInputWrapper = styled.div`
  padding-left: 30px;
  padding-right: 30px;
  margin-top: 10px;
  margin-bottom: 10px;
`;

export interface BlockProps<V = any> {
  itemId?: string | null;
  value: V;
  onChange: React.Dispatch<React.SetStateAction<V>>;
  autofocus?: boolean;
  disabled?: boolean;
}

export type BlockConstructorFn<V = any> = (props: BlockProps<V>) => JSX.Element;

export interface BlockCaseProps<V = any> {
  label: string;
  icon: ReactElement;
  defaultValue: ValueConstructor<V>;
  field: BlockConstructorFn<V>;
}

export interface BlockListValue<T extends string = string, V = any> {
  key: string;
  type: T;
  value: V;
}

export type BlockMapType = Record<string, BlockCaseProps>;

export type BlockMapForValue<R extends BlockListValue> = UnionToIntersection<
  R extends BlockListValue<infer T, infer V> ? { [K in T]: BlockCaseProps<V> }
  : never
>;

export interface BlockListItemProps<T extends string = string, V = any> {
  itemId: string | null | undefined;
  index: number;
  value: BlockListValue<T, V>;
  icon: React.ReactElement;
  autofocus: boolean;
  disabled?: boolean;

  onChange: (
    index: number,
    value: React.SetStateAction<BlockListValue<T, V>>
  ) => void;
  onDelete: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  children: (props: BlockProps<V>) => JSX.Element;
}

export const BlockListItem = memo(function BlockListItem({
  itemId,
  index,
  value,
  icon,
  autofocus,
  disabled,
  children,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockListItemProps) {
  const handleValueChange = useCallback(
    (fieldValue: React.SetStateAction<any>) => {
      onChange(index, value => {
        return {
          ...value,
          value:
            isFunctionalUpdate(fieldValue) ?
              fieldValue(value.value)
            : {
                blockStyle: value.value.blockStyle,
                ...fieldValue,
              },
        };
      });
    },
    [onChange, index]
  );

  return (
    <ListItemWrapper
      value={value}
      icon={icon}
      disabled={disabled}
      onDelete={() => onDelete(index)}
      onMoveUp={onMoveUp ? () => onMoveUp(index) : undefined}
      onMoveDown={onMoveDown ? () => onMoveDown(index) : undefined}
      onStyleChange={blockStyle =>
        handleValueChange({ ...value.value, blockStyle })
      }
    >
      {children({
        value: value.value,
        onChange: handleValueChange,
        autofocus,
        disabled,
        itemId,
      })}
    </ListItemWrapper>
  );
});

export interface BlockListProps<V extends BlockListValue>
  extends BlockProps<V[]> {
  blockMap: BlockMapForValue<V>;
}

export function BlockList<V extends BlockListValue>({
  itemId,
  value: values,
  blockMap: blocMap,
  disabled,
  onChange,
}: BlockListProps<V>) {
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const blockMap = blocMap as BlockMapType;

  const handleItemChange = useCallback(
    (index: number, itemValue: React.SetStateAction<BlockListValue>) => {
      onChange((value: any) => {
        return Object.assign([], value, {
          [index]:
            isFunctionalUpdate(itemValue) ? itemValue(value[index]) : itemValue,
        });
      });
    },
    [onChange]
  );

  const handleAdd = useCallback(
    (index: number, type: string) => {
      setFocusIndex(index);
      onChange((values: any) => {
        const { defaultValue } = blockMap[type];
        const valuesCopy = values.slice();

        valuesCopy.splice(index, 0, {
          key: nanoid(),
          type,
          value:
            isValueConstructor(defaultValue) ? defaultValue() : defaultValue,
        } as V);

        return valuesCopy;
      });
    },
    [blockMap, onChange]
  );

  const handleRemove = useCallback(
    (itemIndex: number) => {
      onChange((value: any) =>
        value.filter((value: any, index: any) => index !== itemIndex)
      );
    },
    [onChange]
  );

  const handleMoveIndex = useCallback(
    (from: number, to: number) => {
      onChange((values: any) => {
        const valuesCopy = values.slice();
        const [value] = valuesCopy.splice(from, 1);

        valuesCopy.splice(to, 0, value);

        return valuesCopy;
      });
    },
    [onChange]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      handleMoveIndex(index, index - 1);
    },
    [handleMoveIndex]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      handleMoveIndex(index, index + 1);
    },
    [handleMoveIndex]
  );

  function addButtonForIndex(index: number) {
    return (
      <AddBlockInputWrapper>
        <AddBlockInput
          menuItems={Object.entries(blockMap).map(
            ([type, { icon, label }]) => ({
              id: type,
              icon,
              label,
            })
          )}
          onMenuItemClick={({ id }: { id: string }) => handleAdd(index, id)}
          subtle={index !== values.length || disabled}
          disabled={disabled}
        />
      </AddBlockInputWrapper>
    );
  }

  function listItemForIndex(value: V, index: number) {
    const hasPrevIndex = index - 1 >= 0;
    const hasNextIndex = index + 1 < values.length;
    const blockDef = blockMap[value.type];

    return (
      <Fragment key={value.key}>
        <BlockListItem
          index={index}
          itemId={itemId}
          value={value}
          icon={blockDef.icon}
          onDelete={handleRemove}
          onChange={handleItemChange}
          onMoveUp={hasPrevIndex ? handleMoveUp : undefined}
          onMoveDown={hasNextIndex ? handleMoveDown : undefined}
          autofocus={focusIndex === index}
          disabled={disabled}
        >
          {blockDef.field}
        </BlockListItem>
        {addButtonForIndex(index + 1)}
      </Fragment>
    );
  }

  return (
    <AddButton>
      {addButtonForIndex(0)}
      {values.map((value: any, index: any) => listItemForIndex(value, index))}
    </AddButton>
  );
}

interface ListItemWrapperProps {
  value: BlockListItemProps['value'];
  children?: ReactNode;
  icon?: React.ReactElement;
  disabled?: boolean;

  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onStyleChange?: (blockStyle?: BlockStyle['id']) => void;
}

const client = getApiClientV2();

function ListItemWrapper({
  value,
  children,
  icon,
  disabled,
  onDelete,
  onMoveUp,
  onMoveDown,
  onStyleChange,
}: ListItemWrapperProps) {
  const { t } = useTranslation();
  const { data } = useBlockStylesQuery({ client });

  const stylesForBlock = useMemo(
    () =>
      data?.blockStyles.filter(blockStyle =>
        blockStyle.blocks.includes(value.type as EditorBlockType)
      ) ?? [],
    [data?.blockStyles, value.type]
  );

  const blockStyleValue = useMemo(
    // input is id & output is name
    () =>
      data?.blockStyles.find(style =>
        [style.id, style.name].includes(value.value.blockStyle)
      ),
    [data?.blockStyles, value.value.blockStyle]
  );

  useEffect(() => {
    if (blockStyleValue && blockStyleValue.id !== value.value.blockStyle) {
      onStyleChange?.(blockStyleValue?.id);
    }
  }, [blockStyleValue, onStyleChange, value.value.blockStyle]);

  return (
    <ListItem>
      <LeftButtonsWrapper>
        <IconButton
          icon={<MdDelete />}
          onClick={onDelete}
          disabled={onDelete == null || disabled}
        />

        <FlexGrow />

        <UpwardButtonWrapper>
          <IconButton
            icon={<MdArrowUpward />}
            onClick={onMoveUp}
            disabled={onMoveUp == null || disabled}
          />
        </UpwardButtonWrapper>

        <DownwardButtonWrapper>
          <IconButton
            title=""
            icon={<MdArrowDownward />}
            onClick={onMoveDown}
            disabled={onMoveDown == null || disabled}
          />
        </DownwardButtonWrapper>
        <FlexGrow />
      </LeftButtonsWrapper>

      <PanelWrapper>
        <Panel bordered>
          <ChildrenWrapper>{children}</ChildrenWrapper>
        </Panel>
      </PanelWrapper>

      <BlockStyleIconWrapper>
        <Icon>
          {icon} {t('blockStyles.style')}
        </Icon>

        <BlockStyleSelect
          cleanable
          value={blockStyleValue?.id}
          data={stylesForBlock.map(style => ({
            value: style.id,
            label: style.name,
          }))}
          onChange={blockStyle => {
            onStyleChange?.(blockStyle as string | undefined);
          }}
        />
      </BlockStyleIconWrapper>
    </ListItem>
  );
}
