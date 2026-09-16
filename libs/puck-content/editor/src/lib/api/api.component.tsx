import { useApolloClient } from '@apollo/client';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { AutoField, FieldLabel, FieldProps } from '@puckeditor/core';
import {
  FormEvent,
  isValidElement,
  ReactElement,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdChevronLeft,
  MdChevronRight,
  MdLink,
  MdLockOpen,
  MdSearch,
  MdTune,
} from 'react-icons/md';

import { ApiField, defaultApiFieldTake } from './api.field';

const Actions = styled.div`
  display: flex;
  gap: 4px;
`;

const SelectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-height: 34px;
  padding: 8px 12px;
  border: 1px solid var(--puck-color-grey-09);
  border-radius: 4px;
  background: var(--puck-color-white);
  color: var(--puck-color-grey-03);
  font: inherit;
  font-size: var(--puck-font-size-xxs);
  text-align: left;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
`;

const DetachButton = styled(SelectButton)`
  flex: 0;
`;

const ClickableRow = styled(TableRow)`
  cursor: pointer;
  white-space: nowrap;
`;

const Filters = styled.div`
  display: grid;
  gap: 12px;
`;

const Grid = styled.div<{ hasFilters: boolean }>`
  display: grid;
  gap: 16px;
  grid-template-columns: ${({ hasFilters }) =>
    hasFilters ? '240px minmax(0, 1fr)' : 'minmax(0, 1fr)'};
`;

export type ApiFieldRenderProps = FieldProps<ApiField, unknown>;

type ApiFieldDialogProps = {
  field: ApiField;
  onSelect: (item: unknown) => void;
};

const ApiFieldDialog = ({ field, onSelect }: ApiFieldDialogProps) => {
  const { t } = useTranslation();
  const client = useApolloClient();
  const take = field.take ?? defaultApiFieldTake;
  const hasFilterFields = !!field.filterFields;

  const [searchInput, setSearchInput] = useState(field.initialQuery ?? '');
  const [query, setQuery] = useState(field.initialQuery ?? '');
  const [filters, setFilters] = useState<Record<string, unknown>>(
    field.initialFilters ?? {}
  );
  const [filtersToggled, setFiltersToggled] = useState(hasFilterFields);
  const [cursors, setCursors] = useState<(string | null | undefined)[]>([
    undefined,
  ]);
  const cursor = cursors[cursors.length - 1];

  const useFetchList = field.useFetchList;
  const result = useFetchList(client, { query, filters, cursor, take });
  const items = useMemo(() => result?.nodes ?? [], [result]);
  const rows = useMemo(() => {
    const mapRow =
      field.mapRow ??
      ((item: unknown) =>
        item as Record<string, string | number | ReactElement>);

    return items.map(mapRow);
  }, [items, field.mapRow]);
  const keys = useMemo(() => {
    const validKeys = new Set<string>();

    for (const row of rows) {
      for (const [key, value] of Object.entries(row)) {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          isValidElement(value)
        ) {
          validKeys.add(key);
        }
      }
    }

    return Array.from(validKeys);
  }, [rows]);

  const resetPagination = () => setCursors([undefined]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setQuery(searchInput);
    resetPagination();
  };

  const handleFilterChange = (name: string, value: unknown) => {
    setFilters(current => ({ ...current, [name]: value }));
    resetPagination();
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>
        {field.showSearch ?
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <TextField
              fullWidth
              size="small"
              type="search"
              name="q"
              autoComplete="off"
              placeholder={field.placeholder}
              value={searchInput}
              onChange={event => setSearchInput(event.currentTarget.value)}
              InputProps={{ startAdornment: <MdSearch /> }}
            />

            <Button
              type="submit"
              variant="contained"
            >
              {t('', 'Search')}
            </Button>

            {hasFilterFields && (
              <IconButton
                type="button"
                title={t('', 'Toggle filters')}
                onClick={() => setFiltersToggled(!filtersToggled)}
              >
                <MdTune />
              </IconButton>
            )}
          </Stack>
        : (field.placeholder ?? t('', 'Select data'))}
      </DialogTitle>

      <DialogContent>
        {!result && <LinearProgress />}

        <Grid hasFilters={hasFilterFields && filtersToggled}>
          {hasFilterFields && filtersToggled && (
            <Filters>
              {Object.entries(field.filterFields ?? {}).map(
                ([name, filterField]) => (
                  <FieldLabel
                    key={name}
                    label={filterField.label ?? name}
                  >
                    <AutoField
                      field={filterField}
                      id={`api_field_${name}_filter`}
                      value={filters[name]}
                      onChange={value => handleFilterChange(name, value)}
                    />
                  </FieldLabel>
                )
              )}
            </Filters>
          )}

          <Table size="small">
            <TableHead>
              <TableRow>
                {keys.map(key => (
                  <TableCell key={key}>{key}</TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row, index) => (
                <ClickableRow
                  key={index}
                  hover
                  onClick={() => onSelect(items[index])}
                >
                  {keys.map(key => (
                    <TableCell key={key}>{row[key]}</TableCell>
                  ))}
                </ClickableRow>
              ))}
            </TableBody>
          </Table>
        </Grid>
      </DialogContent>

      <DialogActions>
        {field.renderFooter ?
          field.renderFooter({ items, totalCount: result?.totalCount ?? 0 })
        : <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flex: 1 }}
          >
            {t('', '{{count}} results', { count: result?.totalCount ?? 0 })}
          </Typography>
        }

        <IconButton
          type="button"
          title={t('', 'Previous page')}
          disabled={cursors.length <= 1}
          onClick={() => setCursors(current => current.slice(0, -1))}
        >
          <MdChevronLeft />
        </IconButton>

        <IconButton
          type="button"
          title={t('', 'Next page')}
          disabled={!result?.pageInfo.hasNextPage}
          onClick={() =>
            setCursors(current => [...current, result?.pageInfo.endCursor])
          }
        >
          <MdChevronRight />
        </IconButton>
      </DialogActions>
    </form>
  );
};

export const ApiFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
  id,
}: ApiFieldRenderProps) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const mapProp = field.mapProp ?? ((item: unknown) => item);

  return (
    <FieldLabel
      label={field.label ?? field.placeholder ?? t('', 'Select data')}
      readOnly={readOnly}
      el="div"
    >
      <Actions id={id}>
        <SelectButton
          type="button"
          disabled={readOnly}
          onClick={() => setOpen(true)}
        >
          {value ?
            field.getItemSummary ?
              field.getItemSummary(value)
            : t('', 'External item')
          : <>
              <MdLink size={16} />
              <span>{field.placeholder ?? t('', 'Select data')}</span>
            </>
          }
        </SelectButton>

        {!!value && (
          <DetachButton
            type="button"
            disabled={readOnly}
            title={t('', 'Detach')}
            onClick={() => onChange(null)}
          >
            <MdLockOpen size={16} />
          </DetachButton>
        )}
      </Actions>

      <Dialog
        open={isOpen}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        {isOpen && (
          <ApiFieldDialog
            field={field}
            onSelect={item => {
              onChange(mapProp(item));
              setOpen(false);
            }}
          />
        )}
      </Dialog>
    </FieldLabel>
  );
};
