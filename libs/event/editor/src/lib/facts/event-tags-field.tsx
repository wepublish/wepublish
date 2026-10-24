import { FullTagFragment, TagType } from '@wepublish/editor/api';
import { EVENT_TAGS_MAX } from '@wepublish/event/schedule';
import { SelectTags } from '@wepublish/ui/editor';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues } from '../event-form-schema';
import { translateFormError } from '../form-error';

export function EventTagsField({
  defaultTags,
}: {
  defaultTags: Pick<FullTagFragment, 'id' | 'tag'>[];
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();

  return (
    <Controller
      control={control}
      name="tagIds"
      render={({ field, fieldState }) => {
        const error = translateFormError(t, fieldState.error?.message);

        return (
          <SelectTags
            name={field.name}
            tagType={TagType.Event}
            defaultTags={defaultTags}
            selectedTags={field.value}
            setSelectedTags={field.onChange}
            maxTags={EVENT_TAGS_MAX}
            label={t('agenda.form.tags')}
            error={!!error}
            helperText={
              error ??
              (field.value.length >= EVENT_TAGS_MAX ?
                t('agenda.form.tagsAtMax', { max: EVENT_TAGS_MAX })
              : t('agenda.form.tagsHelp', { max: EVENT_TAGS_MAX }))
            }
          />
        );
      }}
    />
  );
}
