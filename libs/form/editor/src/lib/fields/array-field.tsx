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
import { useRef, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import {
  MdAdd,
  MdArrowDownward,
  MdArrowUpward,
  MdDeleteOutline,
} from 'react-icons/md';
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const Cell = styled(TableCell)`
  vertical-align: top;
`;

type RowActionsProps = {
  index: number;
  count: number;
  sortable: boolean;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
};

function RowActions({
  index,
  count,
  sortable,
  disabled,
  onMove,
  onRemove,
}: RowActionsProps) {
  const { t } = useTranslation();
  const position = { position: index + 1 };

  return (
    <Actions>
      {sortable ?
        <>
          <IconButton
            size="small"
            aria-label={t('form.array.moveUp', position)}
            disabled={disabled || index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            <MdArrowUpward />
          </IconButton>
          <IconButton
            size="small"
            aria-label={t('form.array.moveDown', position)}
            disabled={disabled || index === count - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <MdArrowDownward />
          </IconButton>
        </>
      : null}
      <IconButton
        size="small"
        aria-label={t('form.array.remove', position)}
        disabled={disabled}
        onClick={() => onRemove(index)}
      >
        <MdDeleteOutline />
      </IconButton>
    </Actions>
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
  sortable = false,
  addLabel,
}: ArrayFieldProps) {
  const { t } = useTranslation();
  const list = useArrayField();
  const addRef = useRef<HTMLButtonElement>(null);
  const editable = !list.readOnly;
  const full =
    list.info.maxLength !== undefined && list.count >= list.info.maxLength;
  const child = inheritedFlags(list);
  const keys = list.itemKeys.map(item => item.key);
  const hasTitle = hasGroupTitle(list);

  const remove = (index: number) => {
    flushSync(() => list.remove(index));
    addRef.current?.focus();
  };

  const actions = (index: number) =>
    editable ?
      <RowActions
        index={index}
        count={list.count}
        sortable={sortable}
        disabled={list.disabled}
        onMove={list.move}
        onRemove={remove}
      />
    : null;

  const items =
    variant === 'table' ?
      <TableContainer>
        <Table
          size="small"
          aria-labelledby={hasTitle ? groupTitleId(list) : undefined}
          aria-label={
            !hasTitle && typeof list.label === 'string' ? list.label : undefined
          }
        >
          <TableHead>
            <TableRow>
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
          <TableBody>
            {list.items.map(item => (
              <TableRow key={item.key}>
                {list.renderItem(item.index, {
                  ...child,
                  component: bindComponent(ItemCells, { keys }),
                })}
                {editable ?
                  <Cell>{actions(item.index)}</Cell>
                : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    : <Rows>
        {list.items.map(item => (
          <Row key={item.key}>
            <div>{list.renderItem(item.index, child)}</div>
            {actions(item.index)}
          </Row>
        ))}
      </Rows>;

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
          variant="outlined"
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
