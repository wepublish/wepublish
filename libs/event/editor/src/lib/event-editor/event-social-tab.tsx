import { Drawer, FormControl, FormLabel, TextField } from '@mui/material';
import { EditorEventFragment, FullImageFragment } from '@wepublish/editor/api';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  FormFields,
  FormSectionTitle,
  getSeoPreviewData,
  ImageSelectPanel,
  SeoContentType,
  SocialPreviews,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues } from '../event-form-schema';

type TextFieldName =
  | 'slug'
  | 'seoTitle'
  | 'seoDescription'
  | 'socialMediaTitle'
  | 'socialMediaDescription';

function MetadataText({
  name,
  multiline,
}: {
  name: TextFieldName;
  multiline?: boolean;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          {...field}
          inputRef={field.ref}
          label={t(`agenda.editor.social.${name}`)}
          helperText={t(`agenda.editor.social.${name}Help`)}
          multiline={multiline}
          minRows={multiline ? 3 : undefined}
          fullWidth
        />
      )}
    />
  );
}

export function EventSocialTab({
  event,
}: {
  event: EditorEventFragment | undefined;
}) {
  const { t } = useTranslation();
  const [choosing, setChoosing] = useState(false);
  const { control, setValue } = useFormContext<EventFormValues>();
  const values = useWatch({ control });

  const chooseImage = (image: FullImageFragment | null) =>
    setValue('socialMediaImage', image, { shouldDirty: true });

  return (
    <FormFields>
      <FormSectionTitle>{t('agenda.editor.sections.search')}</FormSectionTitle>
      <MetadataText name="slug" />
      <MetadataText name="seoTitle" />
      <MetadataText
        name="seoDescription"
        multiline
      />

      <FormSectionTitle>{t('agenda.editor.sections.social')}</FormSectionTitle>
      <FormControl fullWidth>
        <FormLabel>{t('agenda.editor.social.socialMediaImage')}</FormLabel>
        <ChooseEditImage
          image={values.socialMediaImage as FullImageFragment | null}
          disabled={false}
          openChooseModalOpen={() => setChoosing(true)}
          removeImage={() => chooseImage(null)}
        />
      </FormControl>
      <MetadataText name="socialMediaTitle" />
      <MetadataText
        name="socialMediaDescription"
        multiline
      />

      <SocialPreviews
        data={getSeoPreviewData(
          SeoContentType.Event,
          {
            title: values.name,
            lead: values.printDescription,
            seoTitle: values.seoTitle,
            seoDescription: values.seoDescription,
            socialMediaTitle: values.socialMediaTitle,
            socialMediaDescription: values.socialMediaDescription,
            url: event?.url,
            socialMediaImage:
              values.socialMediaImage as FullImageFragment | null,
          },
          {}
        )}
      />

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
          onSelect={image => {
            setChoosing(false);
            chooseImage(image);
          }}
        />
      </Drawer>
    </FormFields>
  );
}
