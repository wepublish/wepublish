export const VENUES_PATH = '/venues';

export const venueEditPath = (id: string) => `${VENUES_PATH}/edit/${id}`;

export const venueCreatePath = (organizationId?: string) =>
  organizationId ?
    `${VENUES_PATH}/create?organizationId=${encodeURIComponent(organizationId)}`
  : `${VENUES_PATH}/create`;
