export enum PaymentSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
}

export interface PaymentFilter {
  intentID?: string;
}
