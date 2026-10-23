import {
  EditorPlaceFragment,
  EditorPlaceListItemFragment,
} from '@wepublish/editor/api';

export const testPlace = (
  overrides: Partial<EditorPlaceFragment> = {}
): EditorPlaceFragment => ({
  __typename: 'Place',
  id: 'place-1',
  name: 'Nuithonie',
  slug: 'nuithonie',
  about: 'A theatre',
  address: 'Rue du Centre 7',
  zip: '1752',
  city: 'Villars-sur-Glâne',
  capacity: '500 seats',
  website: 'https://nuithonie.ch',
  enabled: true,
  private: false,
  regionId: 'region-1',
  organization: {
    __typename: 'SensitiveDataOrganization',
    id: 'org-1',
    name: 'Equilibre',
  },
  proInfirmisIdSource: null,
  proInfirmisDetailUrl: null,
  proInfirmisPictograms: null,
  wheelchairAccessible: true,
  wheelchairAccessibleParking: false,
  wheelchairAccessibleToilets: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-10-01T00:00:00.000Z',
  viewerCan: {
    __typename: 'PlaceViewerPermissions',
    update: true,
    delete: true,
  },
  ...overrides,
});

export const testPlaceListItem = (
  overrides: Partial<EditorPlaceListItemFragment> = {}
): EditorPlaceListItemFragment => ({
  __typename: 'Place',
  id: 'place-1',
  name: 'Nuithonie',
  address: 'Rue du Centre 7',
  zip: '1752',
  city: 'Villars-sur-Glâne',
  enabled: true,
  private: false,
  organization: {
    __typename: 'SensitiveDataOrganization',
    id: 'org-1',
    name: 'Equilibre',
  },
  viewerCan: {
    __typename: 'PlaceViewerPermissions',
    update: true,
    delete: true,
  },
  ...overrides,
});
