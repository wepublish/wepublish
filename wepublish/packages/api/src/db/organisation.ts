import {ConnectionResult, SortOrder, InputCursor, Limit} from './common'

export interface Organisation {
  id: string
  name: string
  location: string
  createdAt: Date
  modifiedAt: Date
}

export interface OrganisationInput {
  name: string
  location: string
}

export interface CreateOrganisationArgs {
  input: OrganisationInput
}

export enum OrganisationSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  Name = 'name',
  Location = 'location'
}

export interface OrganisationFilter {
  name?: string
  location?: string
}

export interface GetOrganisationArgs {
  cursor: InputCursor
  limit: Limit
  filter?: OrganisationFilter
  sort: OrganisationSort
  order: SortOrder
}

export interface DBOrganisationAdapter {
  createOrganisation(args: CreateOrganisationArgs): Promise<Organisation>
  getOrganisations(args: GetOrganisationArgs): Promise<ConnectionResult<Organisation>>
}
