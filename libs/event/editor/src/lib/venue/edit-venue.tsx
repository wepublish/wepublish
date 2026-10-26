import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@mui/material';
import {
  DeletePlaceDocument,
  EditorPlaceDocument,
  UpdatePlaceDocument,
} from '@wepublish/editor/api';
import { CanUpdateOtherOrganizations } from '@wepublish/permissions';
import {
  enqueueSnackbar,
  SingleViewTitle,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { ConfirmDialog } from '../confirm-dialog';
import { FormSection } from '../form-layout';
import { showError } from '../show-error';
import { ProInfirmisSummary } from './pro-infirmis-summary';
import { venueDeleteRefusal } from './venue-delete-refusal';
import { VenueForm } from './venue-form';
import {
  emptyVenueForm,
  placeVariables,
  venueFormFromPlace,
  VenueFormValues,
  venueFormSchema,
} from './venue-form-schema';
import { VENUES_PATH } from './venue-paths';

export function EditVenue() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useApolloClient();
  const closeAfterSave = useRef(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const mayUseAnyOrganization =
    useAuthorisation(CanUpdateOtherOrganizations.id) === true;

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(
      venueFormSchema({ organizationRequired: !mayUseAnyOrganization })
    ),
    defaultValues: async () => {
      try {
        const { data } = await client.query({
          query: EditorPlaceDocument,
          variables: { id },
        });

        return data?.place ? venueFormFromPlace(data.place) : emptyVenueForm();
      } catch (error) {
        showError(error);

        return emptyVenueForm();
      }
    },
  });
  const name = useWatch({ control: form.control, name: 'name' });

  const { data } = useQuery(EditorPlaceDocument, { variables: { id } });
  const place = data?.place;

  const [updatePlace, { loading }] = useMutation(UpdatePlaceDocument);
  const [deletePlace, { loading: deleting }] = useMutation(DeletePlaceDocument);

  const save = async (values: VenueFormValues) => {
    const close = closeAfterSave.current;
    closeAfterSave.current = false;

    try {
      const { data: saved } = await updatePlace({
        variables: { id, ...placeVariables(values) },
      });

      if (saved?.updatePlace) {
        form.reset(venueFormFromPlace(saved.updatePlace));
      }

      enqueueSnackbar(t('agenda.venues.form.saved'), { variant: 'success' });

      if (close) {
        navigate(VENUES_PATH);
      }
    } catch (error) {
      showError(error);
    }
  };

  const remove = async () => {
    try {
      await deletePlace({ variables: { id } });
      navigate(VENUES_PATH);
    } catch (error) {
      setDeleteError(venueDeleteRefusal(t, error));
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
          disabled={place?.viewerCan.update === false}
          title={t('agenda.venues.form.editTitle', { name })}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={VENUES_PATH}
          setCloseFn={close => {
            closeAfterSave.current = close;
          }}
        >
          {place?.viewerCan.delete && (
            <Button
              variant="text"
              color="error"
              onClick={() => {
                setDeleteError(undefined);
                setConfirmDelete(true);
              }}
            >
              {t('agenda.venues.delete.action')}
            </Button>
          )}
        </SingleViewTitle>

        <VenueForm
          isNew={false}
          viewerCan={place?.viewerCan}
          aside={
            <FormSection title={t('agenda.venues.proInfirmis.title')}>
              <ProInfirmisSummary
                idSource={place?.proInfirmisIdSource}
                detailUrl={place?.proInfirmisDetailUrl}
                pictograms={place?.proInfirmisPictograms}
              />
            </FormSection>
          }
        />
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title={t('agenda.venues.delete.title')}
        body={t('agenda.venues.delete.body', { name })}
        confirmLabel={t('agenda.venues.delete.confirm')}
        busy={deleting}
        error={deleteError}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </FormProvider>
  );
}
