import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EventDocument,
  FullEventFragment,
  UpdateEventDocument,
} from '@wepublish/editor/api';
import {
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { EventForm, EventFormValues, eventSchema } from './eventForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const mapApiDataToInput = (event: FullEventFragment): EventFormValues => ({
  id: event.id,
  name: event.name,
  location: event.location,
  startsAt: event.startsAt,
  endsAt: event.endsAt,
  lead: event.lead,
  description: event.description ?? undefined,
  status: event.status,
  image: event.image,
  imageId: event.image?.id,
  tags: event.tags ?? undefined,
  tagIds: event.tags?.map(tag => tag.id),
  externalSourceName: event.externalSourceName ?? undefined,
});

export const EventEditView = () => {
  const { id } = useParams();
  const eventId = id!;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const client = useApolloClient();

  const closePath = '/events';
  const [shouldClose, setShouldClose] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: async () => {
      const { data } = await client.query({
        query: EventDocument,
        variables: { id: eventId },
      });

      return mapApiDataToInput(data!.event);
    },
  });

  const [updateEvent, { loading: updateLoading }] = useMutation(
    UpdateEventDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        if (shouldClose) {
          navigate(closePath);
        }

        if (data.updateEvent) {
          form.reset(mapApiDataToInput(data.updateEvent));
        }
      },
    }
  );

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ image, tags, ...event }) =>
          updateEvent({
            variables: {
              ...event,
              id: eventId,
              endsAt: event.endsAt || null,
            },
          })
        )}
      >
        <SingleViewTitle
          loading={updateLoading}
          title={t('event.edit.title')}
          loadingTitle={t('event.edit.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <EventForm />
      </form>
    </FormProvider>
  );
};
