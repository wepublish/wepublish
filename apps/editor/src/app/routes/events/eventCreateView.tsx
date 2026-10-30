import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateEventDocument } from '@wepublish/editor/api';
import {
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { EventForm, EventFormValues, eventSchema } from './eventForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

export const EventCreateView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/events';
  const [shouldClose, setShouldClose] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { name: '', startsAt: '' },
  });

  const [createEvent, { loading }] = useMutation(CreateEventDocument, {
    onError: onErrorToast,
    onCompleted: event => {
      if (shouldClose) {
        navigate(closePath);
      } else {
        navigate(`/events/edit/${event.createEvent?.id}`);
      }
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ image, tags, id, ...event }) =>
          createEvent({ variables: event })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('event.create.title')}
          loadingTitle={t('event.create.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <EventForm create />
      </form>
    </FormProvider>
  );
};
