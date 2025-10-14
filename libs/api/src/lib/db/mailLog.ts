export enum MailLogSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
}

export interface MailLogFilter {
  readonly subject?: string;
}
