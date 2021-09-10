import {ConnectionResult, InputCursor, Limit, SortOrder} from './common'

export interface MailLogInput {
  readonly recipient: string
  readonly subject: string
  readonly state: MailLogState
  readonly mailData?: string
  readonly mailProviderID: string
}

export interface CreateMailLogArgs {
  readonly input: MailLogInput
}
export interface UpdateMailLogArgs {
  readonly id: string
  readonly input: MailLogInput
}

export interface DeleteMailLogArgs {
  readonly id: string
}

export enum MailLogSort {
  CreatedAt = 'modifiedAt',
  ModifiedAt = 'modifiedAt'
}

export interface MailLogFilter {
  readonly subject?: string
}

export enum MailLogState {
  Submitted = 'submitted',
  Accepted = 'accepted',
  Delivered = 'delivered',
  Deferred = 'deferred',
  Bounced = 'bounced',
  Rejected = 'rejected'
}

export interface MailLog {
  readonly id: string
  readonly createdAt: Date
  readonly modifiedAt: Date
  readonly recipient: string
  readonly subject: string
  readonly state: MailLogState
  readonly mailData?: string
  readonly mailProviderID: string
}

export type OptionalMailLog = MailLog | null

export interface GetMailLogsArgs {
  readonly cursor: InputCursor
  readonly limit: Limit
  readonly filter?: MailLogFilter
  readonly sort: MailLogSort
  readonly order: SortOrder
}

export interface DBMailLogAdapter {
  createMailLog(args: CreateMailLogArgs): Promise<MailLog>
  updateMailLog(args: UpdateMailLogArgs): Promise<OptionalMailLog>
  deleteMailLog(args: DeleteMailLogArgs): Promise<string | null>

  getMailLogsByID(ids: readonly string[]): Promise<OptionalMailLog[]>

  getMailLogs(args: GetMailLogsArgs): Promise<ConnectionResult<MailLog>>
}
