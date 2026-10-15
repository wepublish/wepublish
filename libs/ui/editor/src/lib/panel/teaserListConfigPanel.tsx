import { css } from '@emotion/react';
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

import { InfoTooltip } from '../atoms/infoTooltip';
import { SelectTags } from '../atoms/tag/selectTags';
import { TeaserListBlockValue } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';

const inputStyles = css`
  width: 200px !important;
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
            variant="outlined"
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
              css={inputStyles}
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
              label={
                <>
                  {t('blocks.teaserList.sortLabel')}{' '}
                  <InfoTooltip text={t('blocks.teaserList.sortInfo')} />
                </>
              }
              error={Boolean(error)}
              helperText={error?.message}
              css={inputStyles}
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

        <Controller
          control={control}
          name="skip"
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label={
                <>
                  {t('blocks.teaserList.skipLabel')}{' '}
                  <InfoTooltip text={t('blocks.teaserList.skipInfo')} />
                </>
              }
              type="number"
              onChange={event => field.onChange(+event.target.value)}
              error={Boolean(error)}
              helperText={error?.message}
              css={inputStyles}
              fullWidth
            />
          )}
        />

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
              css={inputStyles}
              fullWidth
            />
          )}
        />

        {sort !== TeaserListBlockSort.HotAndTrending && (
          <div>
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
                  css={inputStyles}
                />
              )}
            />
          </div>
        )}
      </DrawerBody>
    </DrawerForm>
  );
}
