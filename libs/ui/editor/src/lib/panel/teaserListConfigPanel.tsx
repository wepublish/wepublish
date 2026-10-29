import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormLabel, MenuItem, TextField } from '@mui/material';
import {
  TagType,
  TeaserListBlockSort,
  TeaserType,
} from '@wepublish/editor/api';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { SelectTags } from '../atoms/tag/selectTags';
import { TeaserListBlockValue } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';

const Fields = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;
`;

const Form = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const TagsField = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

export type TeaserListConfigPanelProps = {
  value: TeaserListBlockValue;
  onClose(): void;
  onSelect(newValue: TeaserListBlockValue): void;
};

export const useTeaserTypeText = () => {
  const { t } = useTranslation();

  return (tagType: TeaserType) =>
    t(`resources.teaserType.${tagType.toLowerCase()}`);
};

const teaserListSchema = z.object({
  skip: z.coerce.number().min(0),
  take: z.coerce.number().min(0).max(100),
  teaserType: z.enum([TeaserType.Article, TeaserType.Page, TeaserType.Event]),
  sort: z.nativeEnum(TeaserListBlockSort),
  tags: z.array(z.string()),
});

type TeaserListConfigValues = z.infer<typeof teaserListSchema>;

const tagTypeFor = (teaserType: TeaserType) => {
  switch (teaserType) {
    case TeaserType.Article:
      return TagType.Article;
    case TeaserType.Page:
      return TagType.Page;
    case TeaserType.Event:
      return TagType.Event;
  }

  throw new Error('Somehow an unsupported teaser type was selected');
};

export function TeaserListConfigPanel({
  value,
  onClose,
  onSelect,
}: TeaserListConfigPanelProps) {
  const { t } = useTranslation();
  const teaserTypeText = useTeaserTypeText();

  const { control, handleSubmit, setValue } = useForm<TeaserListConfigValues>({
    resolver: zodResolver(teaserListSchema),
    defaultValues: {
      skip: value.skip,
      take: value.take,
      teaserType: value.teaserType as TeaserListConfigValues['teaserType'],
      sort: value.sort ?? TeaserListBlockSort.PublishedAt,
      tags: value.filter.tags ?? [],
    },
  });

  const teaserType = useWatch({ control, name: 'teaserType' });
  const sort = useWatch({ control, name: 'sort' });

  return (
    <DrawerForm
      onSubmit={handleSubmit(({ tags, ...settings }) =>
        onSelect({
          ...value,
          ...settings,
          filter: { ...value.filter, tags },
        })
      )}
    >
      <DrawerHeader>
        <DrawerTitle>{t('blocks.teaserList.edit')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose()}
            type="button"
          >
            {t('close')}
          </Button>

          <Button
            variant="contained"
            type="submit"
          >
            {t('saveAndClose')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <Form>
          <Fields>
            <Controller
              control={control}
              name="teaserType"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  select
                  label={t('blocks.teaserList.teaserTypeLabel')}
                  onChange={event => {
                    field.onChange(event);
                    setValue('tags', []);
                    setValue('sort', TeaserListBlockSort.PublishedAt);
                  }}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                >
                  {[TeaserType.Article, TeaserType.Event, TeaserType.Page].map(
                    type => (
                      <MenuItem
                        key={type}
                        value={type}
                      >
                        {teaserTypeText(type)}
                      </MenuItem>
                    )
                  )}
                </TextField>
              )}
            />

            <Controller
              control={control}
              name="sort"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  select
                  label={t('blocks.teaserList.sortLabel')}
                  error={Boolean(error)}
                  helperText={error?.message ?? t('blocks.teaserList.sortInfo')}
                  fullWidth
                >
                  {[
                    TeaserListBlockSort.PublishedAt,
                    TeaserListBlockSort.UpdatedAt,
                    ...(teaserType === TeaserType.Article ?
                      [TeaserListBlockSort.HotAndTrending]
                    : []),
                  ].map(option => (
                    <MenuItem
                      key={option}
                      value={option}
                    >
                      {t(`resources.teaserSort.${option}`)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Fields>

          <Fields>
            <Controller
              control={control}
              name="take"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('blocks.teaserList.takeLabel')}
                  type="number"
                  onChange={event => field.onChange(+event.target.value)}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="skip"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('blocks.teaserList.skipLabel')}
                  type="number"
                  onChange={event => field.onChange(+event.target.value)}
                  error={Boolean(error)}
                  helperText={error?.message ?? t('blocks.teaserList.skipInfo')}
                  fullWidth
                />
              )}
            />
          </Fields>

          {sort !== TeaserListBlockSort.HotAndTrending && (
            <TagsField>
              <FormLabel>{t('blocks.teaserList.tagsLabel')}</FormLabel>

              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <SelectTags
                    defaultTags={value.filter.tagObjects}
                    name={field.name}
                    tagType={tagTypeFor(teaserType)}
                    setSelectedTags={field.onChange}
                    selectedTags={field.value}
                  />
                )}
              />
            </TagsField>
          )}
        </Form>
      </DrawerBody>
    </DrawerForm>
  );
}
