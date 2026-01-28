export enum UserRoleSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
}

export interface UserRoleFilter {
  readonly name?: string;
}
