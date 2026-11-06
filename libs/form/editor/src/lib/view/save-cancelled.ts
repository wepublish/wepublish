export class SaveCancelled extends Error {
  constructor() {
    super('The save was cancelled.');
    this.name = 'SaveCancelled';
  }
}

export function cancelSave(): never {
  throw new SaveCancelled();
}

export const isSaveCancelled = (error: unknown): error is SaveCancelled =>
  error instanceof SaveCancelled;
