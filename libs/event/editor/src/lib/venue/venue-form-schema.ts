import { EditorPlaceFragment } from '@wepublish/editor/api';
import { z } from 'zod';

export const VENUE_NAME_MAX_LENGTH = 90;
export const VENUE_ZIP_MAX_LENGTH = 4;

export const VENUE_ERROR_VALUES: Record<string, Record<string, unknown>> = {
  'agenda.venues.errors.nameTooLong': { max: VENUE_NAME_MAX_LENGTH },
  'agenda.venues.errors.zipTooLong': { max: VENUE_ZIP_MAX_LENGTH },
};

const required = (message: string) => z.string().trim().min(1, message);

const venueFields = z.object({
  name: required('agenda.venues.errors.nameRequired').max(
    VENUE_NAME_MAX_LENGTH,
    'agenda.venues.errors.nameTooLong'
  ),
  about: z.string(),
  address: required('agenda.venues.errors.addressRequired'),
  zip: required('agenda.venues.errors.zipRequired').max(
    VENUE_ZIP_MAX_LENGTH,
    'agenda.venues.errors.zipTooLong'
  ),
  city: required('agenda.venues.errors.cityRequired'),
  capacity: z.string(),
  website: z.string(),
  regionId: z.string(),
  organization: z.object({ id: z.string(), name: z.string() }).nullable(),
  enabled: z.boolean(),
  private: z.boolean(),
  wheelchairAccessible: z.boolean(),
  wheelchairAccessibleParking: z.boolean(),
  wheelchairAccessibleToilets: z.boolean(),
});

export type VenueFormValues = z.infer<typeof venueFields>;

const organization = venueFields.shape.organization;

export const venueFormSchema = ({
  organizationRequired,
}: {
  organizationRequired: boolean;
}) =>
  venueFields.extend({
    organization:
      organizationRequired ?
        organization.refine(value => !!value, {
          message: 'agenda.venues.errors.organizationRequired',
        })
      : organization,
  });

export const emptyVenueForm = (): VenueFormValues => ({
  name: '',
  about: '',
  address: '',
  zip: '',
  city: '',
  capacity: '',
  website: '',
  regionId: '',
  organization: null,
  enabled: true,
  private: false,
  wheelchairAccessible: false,
  wheelchairAccessibleParking: false,
  wheelchairAccessibleToilets: false,
});

export const venueFormFromPlace = (
  place: EditorPlaceFragment
): VenueFormValues => ({
  name: place.name,
  about: place.about ?? '',
  address: place.address,
  zip: place.zip,
  city: place.city,
  capacity: place.capacity ?? '',
  website: place.website ?? '',
  regionId: place.regionId ?? '',
  organization:
    place.organization ?
      { id: place.organization.id, name: place.organization.name }
    : null,
  enabled: place.enabled,
  private: place.private,
  wheelchairAccessible: place.wheelchairAccessible,
  wheelchairAccessibleParking: place.wheelchairAccessibleParking,
  wheelchairAccessibleToilets: place.wheelchairAccessibleToilets,
});

const orNull = (value: string) => value.trim() || null;

export const placeVariables = (values: VenueFormValues) => ({
  name: values.name.trim(),
  about: orNull(values.about),
  address: values.address.trim(),
  zip: values.zip.trim(),
  city: values.city.trim(),
  capacity: orNull(values.capacity),
  website: orNull(values.website),
  regionId: orNull(values.regionId),
  organizationId: values.organization?.id ?? null,
  enabled: values.enabled,
  private: values.private,
  wheelchairAccessible: values.wheelchairAccessible,
  wheelchairAccessibleParking: values.wheelchairAccessibleParking,
  wheelchairAccessibleToilets: values.wheelchairAccessibleToilets,
});
