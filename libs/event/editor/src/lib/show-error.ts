import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';

export const showError = (error: unknown) =>
  enqueueSnackbar(humanizeError(error as Error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
