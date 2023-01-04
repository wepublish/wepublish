export enum MailLogSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface MailLogFilter {
  readonly subject?: string
}
