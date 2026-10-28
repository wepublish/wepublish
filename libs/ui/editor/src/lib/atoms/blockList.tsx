import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Card,
  CardContent,
  IconButton,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  BlockStylesDocument,
  EditorBlockType,
  FullBlockStyleFragment,
} from '@wepublish/editor/api';
import nanoid from 'nanoid';
import {
  Dispatch,
  Fragment,
  JSX,
  memo,
  ReactElement,
  ReactNode,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdArrowDownward,
  MdArrowUpward,
  MdDelete,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';

import {
  isFunctionalUpdate,
  isValueConstructor,
  UnionToIntersection,
  ValueConstructor,
} from '../utility';
import { AddBlockInput, AddBlockMenuItem } from './addBlockInput';
import { BlockGroup } from './blockGroups';
import { IconButtonTooltip } from './iconButtonTooltip';
import { InfoTooltip } from './infoTooltip';

export const BlockStyleIconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 10px;
  gap: 8px;
  position: absolute;
  left: 100%;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    position: static;
    flex-direction: row;
    align-items: center;
    margin: 8px 0 0;
  }
`;

const Icon = styled.div`
  display: flex;
  align-items: center;
  fill: gray;
  gap: 8px;
`;

const BlockStyleSelect = styled(TextField)`
  width: 150px;
`;

const ChildrenWrapper = styled.div`
  padding: 20px;
`;

const Panel = styled(Card)`
  width: 100%;
`;

const BareBlock = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

export const PanelWrapper = styled.div<{ disabled?: boolean }>`
  display: flex;
  width: 100%;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    flex-direction: column;
  }

  ${({ disabled }) => disabled && `& > * > * {opacity: 0.3;}`}
`;

export const DownwardButtonWrapper = styled.div`
  margin-bottom: 10px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const UpwardButtonWrapper = styled.div`
  margin-top: 10px;
  margin-bottom: 5px;

  &:first-of-type {
    margin-top: 0;
  }
`;

export const LeftButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 10px;
  position: absolute;
  right: 100%;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    position: static;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    margin: 0 0 8px;

    > * {
      margin: 0 !important;
      flex-grow: 0 !important;
    }
  }
`;

export const ListItem = styled.div`
  display: flex;
  width: 100%;
  position: relative;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    flex-direction: column;
  }
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
  onChange: Dispatch<SetStateAction<V>>;
  autofocus?: boolean;
  disabled?: boolean;
  onReplace?: (blocks: BlockListValue[]) => void;
}

export type BlockConstructorFn<V = any> = (props: BlockProps<V>) => JSX.Element;

export interface BlockCaseProps<V = any> {
  label: string;
  icon: ReactElement;
  group: BlockGroup;
  defaultValue: ValueConstructor<V>;
  field: BlockConstructorFn<V>;
  bare?: boolean;
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
  icon: ReactElement;
  bare?: boolean;
  autofocus: boolean;
  disabled?: boolean;

  onChange: (
    index: number,
    value: SetStateAction<BlockListValue<T, V>>
  ) => void;
  onReplace?: (index: number, blocks: BlockListValue[]) => void;
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
  bare,
  autofocus,
  disabled,
  children,
  onChange,
  onReplace,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockListItemProps) {
  const handleValueChange = useCallback(
    (fieldValue: SetStateAction<any>) => {
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

  const handleReplace = useCallback(
    (blocks: BlockListValue[]) => onReplace?.(index, blocks),
    [onReplace, index]
  );

  return (
    <ListItemWrapper
      value={value}
      icon={icon}
      bare={bare}
      disabled={disabled}
      onDelete={() => onDelete(index)}
      onDisable={disabled => handleValueChange({ ...value.value, disabled })}
      onMoveUp={onMoveUp ? () => onMoveUp(index) : undefined}
      onMoveDown={onMoveDown ? () => onMoveDown(index) : undefined}
      onStyleChange={(blockStyleName, blockStyle) =>
        handleValueChange({ ...value.value, blockStyleName, blockStyle })
      }
    >
      {children({
        value: value.value,
        onChange: handleValueChange,
        onReplace: onReplace && handleReplace,
        autofocus,
        disabled,
        itemId,
      })}
    </ListItemWrapper>
  );
});

interface AddBlockButtonProps {
  index: number;
  menuItems: AddBlockMenuItem[];
  onAdd: (index: number, type: string) => void;
  subtle?: boolean;
  disabled?: boolean;
}

const AddBlockButton = memo(function AddBlockButton({
  index,
  menuItems,
  onAdd,
  subtle,
  disabled,
}: AddBlockButtonProps) {
  const handleMenuItemClick = useCallback(
    ({ id }: AddBlockMenuItem) => onAdd(index, id),
    [onAdd, index]
  );

  return (
    <AddBlockInputWrapper>
      <AddBlockInput
        menuItems={menuItems}
        onMenuItemClick={handleMenuItemClick}
        subtle={subtle}
        disabled={disabled}
      />
    </AddBlockInputWrapper>
  );
});

export interface BlockListProps<V extends BlockListValue> extends BlockProps<
  V[]
> {
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
    (index: number, itemValue: SetStateAction<BlockListValue>) => {
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

  const handleReplace = useCallback(
    (itemIndex: number, blocks: BlockListValue[]) => {
      onChange((values: any) => {
        const valuesCopy = values.slice();
        valuesCopy.splice(itemIndex, 1, ...blocks);

        return valuesCopy;
      });
    },
    [onChange]
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

  const menuItems = useMemo(
    () =>
      Object.entries(blockMap).map(([type, { icon, label, group }]) => ({
        id: type,
        icon,
        label,
        group,
      })),
    [blockMap]
  );

  function addButtonForIndex(index: number) {
    return (
      <AddBlockButton
        index={index}
        menuItems={menuItems}
        onAdd={handleAdd}
        subtle={index !== values.length || disabled}
        disabled={disabled}
      />
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
          bare={blockDef.bare}
          onDelete={handleRemove}
          onChange={handleItemChange}
          onReplace={handleReplace}
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
  icon?: ReactElement;
  bare?: boolean;
  disabled?: boolean;

  onDelete?: () => void;
  onDisable?: (disable: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onStyleChange?: (
    blockStyleName?: FullBlockStyleFragment['name'],
    blockStyle?: FullBlockStyleFragment['id']
  ) => void;
}

function ListItemWrapper({
  value,
  children,
  icon,
  bare,
  disabled,
  onDisable,
  onDelete,
  onMoveUp,
  onMoveDown,
  onStyleChange,
}: ListItemWrapperProps) {
  const { t } = useTranslation();
  const { data } = useQuery(BlockStylesDocument);

  const stylesForBlock = useMemo(
    () =>
      data?.blockStyles.filter(blockStyle =>
        blockStyle.blocks.includes(value.type as EditorBlockType)
      ) ?? [],
    [data?.blockStyles, value.type]
  );

  const blockStyleId = value.value.blockStyle;
  const visibilityLabel = t(
    value.value.disabled ? 'blockList.showBlock' : 'blockList.hideBlock'
  );

  return (
    <ListItem>
      <LeftButtonsWrapper>
        <UpwardButtonWrapper>
          <IconButtonTooltip caption={visibilityLabel}>
            <IconButton
              size="small"
              aria-label={visibilityLabel}
              onClick={() => onDisable?.(!value.value.disabled)}
            >
              {value.value.disabled ?
                <MdVisibilityOff />
              : <MdVisibility />}
            </IconButton>
          </IconButtonTooltip>
        </UpwardButtonWrapper>

        <DownwardButtonWrapper>
          <IconButtonTooltip caption={t('blockList.deleteBlock')}>
            <IconButton
              size="small"
              color="error"
              aria-label={t('blockList.deleteBlock')}
              onClick={onDelete}
              disabled={onDelete == null || disabled}
            >
              <MdDelete />
            </IconButton>
          </IconButtonTooltip>
        </DownwardButtonWrapper>

        <UpwardButtonWrapper>
          <IconButtonTooltip caption={t('blockList.moveBlockUp')}>
            <IconButton
              color="inherit"
              size="small"
              aria-label={t('blockList.moveBlockUp')}
              onClick={onMoveUp}
              disabled={onMoveUp == null || disabled}
            >
              <MdArrowUpward />
            </IconButton>
          </IconButtonTooltip>
        </UpwardButtonWrapper>

        <DownwardButtonWrapper>
          <IconButtonTooltip caption={t('blockList.moveBlockDown')}>
            <IconButton
              color="inherit"
              size="small"
              aria-label={t('blockList.moveBlockDown')}
              onClick={onMoveDown}
              disabled={onMoveDown == null || disabled}
            >
              <MdArrowDownward />
            </IconButton>
          </IconButtonTooltip>
        </DownwardButtonWrapper>
      </LeftButtonsWrapper>

      <PanelWrapper disabled={value.value.disabled}>
        {bare ?
          <BareBlock>{children}</BareBlock>
        : <Panel variant="outlined">
            <CardContent>
              <ChildrenWrapper>{children}</ChildrenWrapper>
            </CardContent>
          </Panel>
        }
      </PanelWrapper>

      <BlockStyleIconWrapper>
        <Icon>
          {icon} {t('blockStyles.style')}
          <InfoTooltip text={t('blockList.styleHelp')} />
        </Icon>

        <BlockStyleSelect
          select
          value={blockStyleId ?? ''}
          slotProps={{ select: { displayEmpty: true } }}
          onChange={event => {
            const blockStyle = event.target.value || undefined;
            onStyleChange?.(
              stylesForBlock.find(style => style.id === blockStyle)?.name,
              blockStyle
            );
          }}
        >
          <MenuItem value="">{t('blockStyles.noStyle')}</MenuItem>

          {stylesForBlock.map(style => (
            <MenuItem
              key={style.id}
              value={style.id}
            >
              {style.name}
            </MenuItem>
          ))}
        </BlockStyleSelect>
      </BlockStyleIconWrapper>
    </ListItem>
  );
}
