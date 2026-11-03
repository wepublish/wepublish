import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';

export const REVISIONS_PAGE_SIZE = 20;

export const notifySuccess = (title: string) =>
  enqueueSnackbar('', { variant: 'success', title, autoHideDuration: 2000 });

export const notifyFailure = (
  error: unknown,
  t?: Parameters<typeof humanizeError>[1]
) =>
  enqueueSnackbar(humanizeError(error, t), {
    variant: 'error',
    autoHideDuration: null,
  });
