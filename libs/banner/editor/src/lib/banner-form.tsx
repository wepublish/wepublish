import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  FullImageFragment,
  GateActionInput,
  LoginStatus,
  PageListDocument,
} from '@wepublish/editor/api';
import {
  AudienceField,
  BannerFormValues,
  GateActionList,
} from '@wepublish/gate/editor';
import { useState } from 'react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { z } from 'zod';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  FormFields,
  ImageEditPanel,
  ImageSelectPanel,
  InfoTooltip,
} from '@wepublish/ui/editor';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

export const createBannerSchema = (t: TFunction): z.ZodType<BannerFormValues> =>
  z.object({
    title: z.string().min(1, t('errorMessages.required')),
    text: z.string().min(1, t('errorMessages.required')),
    cta: z.string().nullish(),
    html: z.string().nullish(),
    embedUrl: z.string().nullish(),
    active: z.boolean(),
    collapsible: z.boolean(),
    delay: z.coerce.number(),
    hideForMinutes: z.coerce.number(),
    showForLoginStatus: z.nativeEnum(LoginStatus),
    showOnArticles: z.boolean(),
    showOnPages: z.array(z.object({ id: z.string() })),
    imageId: z.string().nullish(),
    image: z.custom<FullImageFragment>().nullish(),
    actions: z.array(z.custom<GateActionInput>()),
  });

interface BannerFormProps {
  create?: boolean;
}

const BannerFormContainer = styled('div')`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  grid-template-areas:
    'displayoptions content'
    'actions        actions';
`;

export const BannerForm = (props: BannerFormProps) => {
  const { t } = useTranslation();
  const { control, setValue } = useFormContext<BannerFormValues>();
  const imageId = useWatch({ control, name: 'imageId' });
  const {
    fields: actions,
    append,
    remove,
    update,
  } = useFieldArray({ control, name: 'actions' as never });

  const { data: pageData } = useQuery(PageListDocument, {
    variables: { take: 50 },
  });

  const pages = pageData?.pages.nodes ?? [];
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  return (
    <BannerFormContainer>
      <Card
        variant="outlined"
        style={{ overflow: 'initial', gridArea: 'displayoptions' }}
      >
        <CardContent>
          <FormFields>
            <Typography variant="h3">
              {t('banner.form.displayOptions')}
            </Typography>

            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={(_event, checked) => field.onChange(checked)}
                    />
                  }
                  label={t('banner.form.active')}
                />
              )}
            />

            <Controller
              control={control}
              name="collapsible"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={(_event, checked) => field.onChange(checked)}
                    />
                  }
                  label={
                    <>
                      {t('banner.form.collapsible')}{' '}
                      <InfoTooltip text={t('banner.form.collapsibleInfo')} />
                    </>
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="delay"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={
                    <>
                      {t('banner.form.delay')}{' '}
                      <InfoTooltip text={t('banner.form.delayInfo')} />
                    </>
                  }
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
              name="hideForMinutes"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('banner.form.hideForMinutes')}
                  type="number"
                  onChange={event => field.onChange(+event.target.value)}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <FormControl>
              <FormLabel>
                {t('banner.form.showForLoginStatus')}{' '}
                <InfoTooltip text={t('banner.form.showForLoginStatusInfo')} />
              </FormLabel>

              <Controller
                control={control}
                name="showForLoginStatus"
                render={({ field }) => (
                  <AudienceField
                    name={field.name}
                    value={field.value}
                    options={Object.values(LoginStatus).map(status => ({
                      value: status,
                      label: t(`banner.form.loginStatus.${status}`),
                    }))}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormControl>

            <Controller
              control={control}
              name="showOnArticles"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={(_event, checked) => field.onChange(checked)}
                    />
                  }
                  label={t('banner.form.showOnArticles')}
                />
              )}
            />

            <FormControl fullWidth>
              <FormLabel>
                {t('banner.form.showOnPages')}{' '}
                <InfoTooltip text={t('banner.form.showOnPagesInfo')} />
              </FormLabel>

              <Controller
                control={control}
                name="showOnPages"
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    disableCloseOnSelect
                    options={pages.map(page => page.id)}
                    getOptionLabel={option =>
                      pages
                        .filter(page => page.id === option)
                        .map(page => page.latest.title)[0] ?? option
                    }
                    value={field.value?.map(page => page.id) ?? []}
                    onChange={(_event, ids) =>
                      field.onChange((ids ?? []).map(id => ({ id })))
                    }
                    renderInput={params => (
                      <TextField
                        {...params}
                        placeholder={t('navigation.panels.selectPage')}
                      />
                    )}
                  />
                )}
              />
            </FormControl>
          </FormFields>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ overflow: 'initial', gridArea: 'content' }}
      >
        <CardContent>
          <FormFields>
            <Typography variant="h3">{t('banner.form.content')}</Typography>

            <Controller
              control={control}
              name="title"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('banner.form.title')}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="text"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('banner.form.text')}
                  multiline
                  rows={5}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="cta"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={
                    <>
                      {t('banner.form.cta')}{' '}
                      <InfoTooltip text={t('banner.form.ctaInfo')} />
                    </>
                  }
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <FormControl fullWidth>
              <FormLabel>{t('banner.form.image')}</FormLabel>

              <Controller
                control={control}
                name="image"
                render={({ field }) => (
                  <ChooseEditImage
                    onSelect={image => {
                      setChooseModalOpen(false);
                      setValue('imageId', image.id);
                      setValue('image', image);
                    }}
                    image={field.value}
                    disabled={false}
                    openChooseModalOpen={() => setChooseModalOpen(true)}
                    openEditModalOpen={() => setEditModalOpen(true)}
                    removeImage={() => {
                      field.onChange(undefined);
                      setValue('imageId', undefined);
                    }}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel>
                {t('banner.form.html')}{' '}
                <InfoTooltip text={t('banner.form.htmlInfo')} />
              </FormLabel>

              <Controller
                control={control}
                name="html"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    rows={5}
                    multiline
                    error={Boolean(error)}
                    helperText={error?.message}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel>{t('banner.form.embedUrl')}</FormLabel>

              <Controller
                control={control}
                name="embedUrl"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    error={Boolean(error)}
                    helperText={error?.message}
                  />
                )}
              />
              <FormHelperText>{t('banner.form.embedUrlHelp')}</FormHelperText>
            </FormControl>
          </FormFields>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ overflow: 'initial', gridArea: 'actions' }}
      >
        <CardContent>
          <Box>
            <Typography variant="h3">{t('banner.form.actions')}</Typography>
            <GateActionList
              actions={actions as unknown as GateActionInput[]}
              onAdd={append}
              onRemove={remove}
              onUpdate={update}
            />
          </Box>
        </CardContent>
      </Card>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isChooseModalOpen}
        onClose={() => {
          setChooseModalOpen(false);
        }}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={image => {
            setChooseModalOpen(false);
            setValue('imageId', image.id);
            setValue('image', image);
          }}
        />
      </Drawer>

      {imageId && (
        <Drawer
          anchor="right"
          slotProps={{
            paper: {
              sx: {
                display: 'flex',
                flexDirection: 'column',
                width: DRAWER_WIDTHS.sm,
                maxWidth: '100vw',
              },
            },
          }}
          open={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={imageId as string}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </BannerFormContainer>
  );
};
