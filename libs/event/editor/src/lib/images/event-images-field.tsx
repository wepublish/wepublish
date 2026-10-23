import styled from '@emotion/styled';
import {
  Drawer,
  FormControlLabel,
  FormLabel,
  Radio,
  TextField,
  Typography,
} from '@mui/material';
import { FullImageFragment } from '@wepublish/editor/api';
import { characterCount } from '@wepublish/event/schedule';
import {
  DRAWER_WIDTHS,
  FieldProps,
  ImageSelectPanel,
  ListInput,
  ListValue,
} from '@wepublish/ui/editor';
import nanoid from 'nanoid';
import { useId, useState } from 'react';
import { Controller, useFormContext, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  EVENT_IMAGE_ALT_TEXT_MAX_LENGTH,
  EVENT_IMAGE_CAPTION_MAX_LENGTH,
  EventFormValues,
  EventImageRef,
} from '../event-form-schema';
import { translateFormError } from '../form-error';

export type EventImageForm = EventFormValues['images'][number]['value'];

export const eventImagesInput = (rows: ListValue<EventImageForm>[]) =>
  rows.map(({ value }) => ({
    imageId: value.image.id,
    caption: value.caption.trim() || null,
    isMain: value.isMain,
  }));

const withOneMain = (rows: ListValue<EventImageForm>[]) => {
  const main = Math.max(
    rows.findIndex(({ value }) => value.isMain),
    0
  );

  return rows.map((row, index) => ({
    ...row,
    value: { ...row.value, isMain: index === main },
  }));
};

const imageRefOf = ({
  id,
  title,
  filename,
  thumbURL,
  squareURL,
  description,
}: FullImageFragment): EventImageRef => ({
  id,
  title,
  filename,
  thumbURL,
  squareURL,
  description,
});

const RowLayout = styled.div`
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;
  padding: ${({ theme }) => theme.spacing(1)} 0;
`;

const Preview = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const Thumbnail = styled.img`
  display: block;
  width: 96px;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.action.hover};
`;

const Fields = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const Help = styled.span`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Notice = styled.span`
  display: block;
  color: ${({ theme }) => theme.vars.palette.warning.main};
`;

const Counter = styled.span`
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`;

function ImageRow({
  value,
  onChange,
  groupName,
  captionError,
  onMain,
}: FieldProps<EventImageForm> & {
  groupName: string;
  captionError?: string;
  onMain: () => void;
}) {
  const { t } = useTranslation();
  const altText = value.altText.trim();
  const altNotice =
    !altText ? t('agenda.images.altTextMissing')
    : characterCount(altText) > EVENT_IMAGE_ALT_TEXT_MAX_LENGTH ?
      t('agenda.images.altTextLong', { max: EVENT_IMAGE_ALT_TEXT_MAX_LENGTH })
    : null;

  return (
    <RowLayout>
      <Preview>
        <Thumbnail
          src={value.image.thumbURL ?? value.image.squareURL ?? undefined}
          alt=""
        />
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
        >
          {value.image.title || value.image.filename}
        </Typography>
      </Preview>

      <Fields>
        <FormControlLabel
          label={t('agenda.images.main')}
          control={
            <Radio
              name={groupName}
              checked={value.isMain}
              onChange={onMain}
            />
          }
        />

        <TextField
          size="small"
          label={t('agenda.images.caption')}
          value={value.caption}
          onChange={event =>
            onChange({ ...value, caption: event.target.value })
          }
          error={!!captionError}
          helperText={
            <Help>
              <span>{captionError ?? t('agenda.images.captionHelp')}</span>
              <Counter>
                {characterCount(value.caption)}/{EVENT_IMAGE_CAPTION_MAX_LENGTH}
              </Counter>
            </Help>
          }
        />

        <TextField
          size="small"
          label={t('agenda.images.altText')}
          value={value.altText}
          onChange={event =>
            onChange({ ...value, altText: event.target.value })
          }
          helperText={
            <Help>
              <span>
                {t('agenda.images.altTextHelp')}
                {altNotice && <Notice>{altNotice}</Notice>}
              </span>
              <Counter>
                {characterCount(value.altText)}/
                {EVENT_IMAGE_ALT_TEXT_MAX_LENGTH}
              </Counter>
            </Help>
          }
        />
      </Fields>
    </RowLayout>
  );
}

export function EventImagesField() {
  const { t } = useTranslation();
  const groupName = useId();
  const [choosing, setChoosing] = useState(false);
  const { control } = useFormContext<EventFormValues>();
  const { errors } = useFormState({ control, name: 'images' });

  return (
    <Controller
      control={control}
      name="images"
      render={({ field }) => {
        const rows = field.value;
        const update = (next: ListValue<EventImageForm>[]) =>
          field.onChange(withOneMain(next));

        const setMain = (imageId: string) =>
          field.onChange(
            rows.map(row => ({
              ...row,
              value: { ...row.value, isMain: row.value.image.id === imageId },
            }))
          );

        const add = (image: FullImageFragment) => {
          setChoosing(false);

          if (rows.some(({ value }) => value.image.id === image.id)) {
            return;
          }

          update([
            ...rows,
            {
              id: nanoid(),
              value: {
                image: imageRefOf(image),
                caption: '',
                altText: image.description ?? '',
                isMain: rows.length === 0,
              },
            },
          ]);
        };

        return (
          <div>
            <FormLabel component="div">{t('agenda.images.title')}</FormLabel>

            <ListInput<EventImageForm>
              value={rows}
              onChange={update}
              addLabel={t('agenda.images.add')}
              onAdd={() => setChoosing(true)}
            >
              {({ value, onChange }) => {
                const index = rows.findIndex(row => row.value === value);

                return (
                  <ImageRow
                    value={value}
                    onChange={onChange}
                    groupName={groupName}
                    captionError={translateFormError(
                      t,
                      errors.images?.[index]?.value?.caption?.message
                    )}
                    onMain={() => setMain(value.image.id)}
                  />
                );
              }}
            </ListInput>

            <Drawer
              anchor="right"
              open={choosing}
              onClose={() => setChoosing(false)}
              slotProps={{
                paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
              }}
            >
              <ImageSelectPanel
                onClose={() => setChoosing(false)}
                onSelect={add}
              />
            </Drawer>
          </div>
        );
      }}
    />
  );
}
