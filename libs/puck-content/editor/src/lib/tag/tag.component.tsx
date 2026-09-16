import { Autocomplete, Chip, TextField } from '@mui/material';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';

import {
  getListItemOptions,
  isSameListItem,
  withoutTakenOptions,
} from '../list/list.field';
import { TagField, TagValue } from './tag.field';

const isEmptyItem = (item: unknown) =>
  item === undefined || item === null || item === '';

export type TagFieldRenderProps<Item> = FieldProps<
  TagField<Item>,
  TagValue<Item>
> & {
  name: string;
  id?: string;
};

export const TagFieldRender = <Item,>({
  field,
  value,
  onChange,
  readOnly,
  id,
}: TagFieldRenderProps<Item>) => {
  const { t } = useTranslation();
  const current = value ?? [];
  const options = getListItemOptions(field.itemField);
  const hasOptions = options !== undefined;
  const remaining = getListItemOptions(
    withoutTakenOptions(field.itemField, current)
  );

  const canAdd =
    !readOnly &&
    (field.max === undefined || current.length < field.max) &&
    (remaining === undefined || remaining.length > 0);
  const canRemove =
    !readOnly && (field.min === undefined || current.length > field.min);

  const labelOf = (item: Item) =>
    options?.find(option => isSameListItem(option.value, item))?.label ??
    String(item);

  const handleChange = (next: Item[]) => {
    const unique = next.filter(
      (item, index) =>
        !isEmptyItem(item) &&
        next.findIndex(other => isSameListItem(other, item)) === index
    );

    if (unique.length > current.length && !canAdd) {
      return;
    }

    if (unique.length < current.length && !canRemove) {
      return;
    }

    onChange(unique);
  };

  return (
    <FieldLabel
      label={field.label ?? t('', 'Tags')}
      readOnly={readOnly}
      el="div"
    >
      <Autocomplete
        id={id}
        multiple
        size="small"
        disabled={readOnly}
        freeSolo={!hasOptions}
        options={
          canAdd ?
            ((remaining ?? []).map(option => option.value) as Item[])
          : []
        }
        value={current}
        getOptionLabel={option => labelOf(option as Item)}
        isOptionEqualToValue={(option, item) => isSameListItem(option, item)}
        onChange={(_event, next) => handleChange(next as Item[])}
        noOptionsText={
          canAdd ? t('', 'No options') : t('', 'No more tags can be added')
        }
        renderTags={(tags, getTagProps) =>
          tags.map((tag, index) => {
            const { key, onDelete, ...tagProps } = getTagProps({ index });

            return (
              <Chip
                {...tagProps}
                key={key}
                size="small"
                label={labelOf(tag)}
                onDelete={canRemove ? onDelete : undefined}
              />
            );
          })
        }
        renderInput={params => (
          <TextField
            {...params}
            placeholder={
              canAdd ?
                hasOptions ?
                  t('', 'Add tag…')
                : t('', 'Type and press enter')
              : undefined
            }
          />
        )}
      />
    </FieldLabel>
  );
};
