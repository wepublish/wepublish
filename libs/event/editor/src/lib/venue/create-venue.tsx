import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreatePlaceDocument,
  TinyOrganizationListDocument,
} from '@wepublish/editor/api';
import { CanUpdateOtherOrganizations } from '@wepublish/permissions';
import {
  enqueueSnackbar,
  SingleViewTitle,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { showError } from '../show-error';
import { VenueForm } from './venue-form';
import {
  emptyVenueForm,
  placeVariables,
  VenueFormValues,
  venueFormSchema,
} from './venue-form-schema';
import { venueEditPath, VENUES_PATH } from './venue-paths';

export function CreateVenue() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useApolloClient();
  const [searchParams] = useSearchParams();
  const closeAfterSave = useRef(false);
  const mayUseAnyOrganization =
    useAuthorisation(CanUpdateOtherOrganizations.id) === true;
  const organizationId = searchParams.get('organizationId');

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(
      venueFormSchema({ organizationRequired: !mayUseAnyOrganization })
    ),
    defaultValues: async () => {
      if (!organizationId) {
        return emptyVenueForm();
      }

      try {
        const { data } = await client.query({
          query: TinyOrganizationListDocument,
          variables: { filter: { ids: [organizationId] }, take: 1 },
        });
        const [organization] = data?.organizations.nodes ?? [];

        return {
          ...emptyVenueForm(),
          organization:
            organization ?
              { id: organization.id, name: organization.name }
            : null,
        };
      } catch (error) {
        showError(error);

        return emptyVenueForm();
      }
    },
  });

  const [createPlace, { loading }] = useMutation(CreatePlaceDocument);

  const save = async (values: VenueFormValues) => {
    const close = closeAfterSave.current;
    closeAfterSave.current = false;

    try {
      const { data } = await createPlace({ variables: placeVariables(values) });

      if (!data?.createPlace) {
        return;
      }

      enqueueSnackbar(t('agenda.venues.form.created'), { variant: 'success' });
      form.reset(values);
      navigate(close ? VENUES_PATH : venueEditPath(data.createPlace.id), {
        replace: !close,
      });
    } catch (error) {
      showError(error);
    }
  };

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={event =>
          form.handleSubmit(save, () => {
            closeAfterSave.current = false;
          })(event)
        }
      >
        <SingleViewTitle
          loading={loading}
          title={t('agenda.venues.form.createTitle')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={VENUES_PATH}
          setCloseFn={close => {
            closeAfterSave.current = close;
          }}
        />

        <VenueForm isNew />
      </form>
    </FormProvider>
  );
}
