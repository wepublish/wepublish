import { enqueueSnackbar } from '@wepublish/ui/editor';

export const REVISIONS_PAGE_SIZE = 20;

export const notifySuccess = (title: string) =>
  enqueueSnackbar('', { variant: 'success', title, autoHideDuration: 2000 });

export const notifyFailure = (error: unknown) =>
  enqueueSnackbar(error instanceof Error ? error.message : String(error), {
    variant: 'error',
    autoHideDuration: null,
  });
