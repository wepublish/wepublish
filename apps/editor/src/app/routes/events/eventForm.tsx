import {
  Box,
  Card,
  CardContent,
  Drawer,
  FormControl,
  FormLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  EventStatus,
  FullImageFragment,
  FullTagFragment,
  TagType,
} from '@wepublish/editor/api';
import { RichtextJSONDocument } from '@wepublish/richtext';
import {
  ChooseEditImage,
  DateTimePicker,
  DRAWER_WIDTHS,
  FormFields,
  ImageEditPanel,
  ImageSelectPanel,
  InfoTooltip,
  RichTextBlock,
  SelectTags,
} from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { useId, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export const createEventSchema = (t: TFunction) =>
  z
    .object({
      id: z.string().optional(),
      name: z.string().min(1, t('errorMessages.noNameErrorMessage')),
      location: z.string().nullish(),
      startsAt: z.string().min(1, t('errorMessages.required')),
      endsAt: z.string().nullish(),
      lead: z.string().nullish(),
      description: z.custom<RichtextJSONDocument>().nullish(),
      status: z.nativeEnum(EventStatus).optional(),
      tagIds: z.array(z.string()).optional(),
      tags: z.array(z.custom<Pick<FullTagFragment, 'id' | 'tag'>>()).optional(),
      imageId: z.string().nullish(),
      image: z.custom<FullImageFragment>().nullish(),
      externalSourceName: z.string().optional(),
    })
    .refine(
      value =>
        !value.endsAt || new Date(value.endsAt) >= new Date(value.startsAt),
      { path: ['endsAt'], message: t('event.form.endsBeforeStart') }
    );

export type EventFormValues = z.infer<ReturnType<typeof createEventSchema>>;

type EventFormProps = {
  create?: boolean;
};

export const EventForm = ({ create }: EventFormProps) => {
  const { t } = useTranslation();
  const { control, setValue } = useFormContext<EventFormValues>();
  const tags = useWatch({ control, name: 'tags' });

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const externalSourceName = useWatch({ control, name: 'externalSourceName' });
  const imageId = useWatch({ control, name: 'imageId' });
  const descriptionLabelId = useId();
  const statusLabelId = useId();
  const tagsLabelId = useId();
  const imageLabelId = useId();

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Card
          variant="outlined"
          style={{ overflow: 'initial' }}
        >
          <CardContent>
            <FormFields>
              <Controller
                control={control}
                name="name"
                render={({
                  field: { ref, ...field },
                  fieldState: { error },
                }) => (
                  <TextField
                    {...field}
                    inputRef={ref}
                    value={field.value ?? ''}
                    label={t('event.form.name')}
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              {externalSourceName && (
                <TextField
                  label={t('event.form.externalSource')}
                  name="externalSourceName"
                  value={externalSourceName}
                  disabled
                  fullWidth
                />
              )}

              <Controller
                control={control}
                name="location"
                render={({
                  field: { ref, ...field },
                  fieldState: { error },
                }) => (
                  <TextField
                    {...field}
                    inputRef={ref}
                    value={field.value ?? ''}
                    label={t('event.form.location')}
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr)',
                    sm: 'minmax(0, 1fr) minmax(0, 1fr)',
                  },
                  gap: 1.5,
                }}
              >
                <Controller
                  control={control}
                  name="startsAt"
                  render={({ field, fieldState: { error } }) => (
                    <Box>
                      <DateTimePicker
                        label={t('event.form.startsAt')}
                        dateTime={
                          field.value ? new Date(field.value) : undefined
                        }
                        changeDate={(date: Date) =>
                          field.onChange(date?.toISOString())
                        }
                        helperText={error?.message}
                        inputRef={field.ref}
                      />
                    </Box>
                  )}
                />

                <Controller
                  control={control}
                  name="endsAt"
                  render={({ field, fieldState: { error } }) => (
                    <Box>
                      <DateTimePicker
                        label={t('event.form.endsAt')}
                        dateTime={
                          field.value ? new Date(field.value) : undefined
                        }
                        changeDate={(date: Date) =>
                          field.onChange(date?.toISOString() ?? null)
                        }
                        helperText={error?.message}
                        inputRef={field.ref}
                      />
                    </Box>
                  )}
                />
              </Box>

              <Controller
                control={control}
                name="lead"
                render={({
                  field: { ref, ...field },
                  fieldState: { error },
                }) => (
                  <TextField
                    {...field}
                    inputRef={ref}
                    value={field.value ?? ''}
                    label={t('event.form.lead')}
                    multiline
                    rows={3}
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <FormControl fullWidth>
                <FormLabel id={descriptionLabelId}>
                  {t('event.form.description')}
                </FormLabel>

                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <RichTextBlock
                      aria-labelledby={descriptionLabelId}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormControl>
            </FormFields>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <FormFields>
              {!create && (
                <FormControl
                  fullWidth
                  sx={{ marginBottom: 3 }}
                >
                  <FormLabel>
                    <span id={statusLabelId}>{t('event.form.status')}</span>{' '}
                    <InfoTooltip text={t('event.form.statusInfo')} />
                  </FormLabel>
                  <Controller
                    control={control}
                    name="status"
                    render={({
                      field: { ref, ...field },
                      fieldState: { error },
                    }) => (
                      <TextField
                        {...field}
                        inputRef={ref}
                        value={field.value ?? ''}
                        select
                        slotProps={{ select: { labelId: statusLabelId } }}
                        error={Boolean(error)}
                        helperText={error?.message}
                        fullWidth
                      >
                        {[
                          [EventStatus.Scheduled, 'event.form.scheduled'],
                          [EventStatus.Cancelled, 'event.form.cancelled'],
                          [EventStatus.Postponed, 'event.form.postponed'],
                          [EventStatus.Rescheduled, 'event.form.rescheduled'],
                        ].map(([status, label]) => (
                          <MenuItem
                            key={status}
                            value={status}
                          >
                            {t(label)}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </FormControl>
              )}

              <FormControl fullWidth>
                <FormLabel id={tagsLabelId}>{t('event.form.tags')}</FormLabel>
                <Controller
                  control={control}
                  name="tagIds"
                  render={({ field }) => (
                    <SelectTags
                      aria-labelledby={tagsLabelId}
                      defaultTags={tags ?? []}
                      selectedTags={field.value ?? []}
                      setSelectedTags={field.onChange}
                      tagType={TagType.Event}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel id={imageLabelId}>{t('event.form.image')}</FormLabel>
                <Controller
                  control={control}
                  name="image"
                  render={({ field }) => (
                    <ChooseEditImage
                      aria-labelledby={imageLabelId}
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
            </FormFields>
          </CardContent>
        </Card>
      </Box>

      <Drawer
        anchor="right"
        slotProps={{
          paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
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
            paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
          }}
          open={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={imageId}
            onClose={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  );
};
