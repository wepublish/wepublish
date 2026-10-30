import { setQueryErrorHandler } from '@wepublish/editor/api';
import { useEffect } from 'react';

import { humanizeError } from './humanizeError';
import { enqueueSnackbar } from './snackbar';

export const useReportQueryErrors = () => {
  useEffect(() => {
    setQueryErrorHandler(error =>
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      })
    );

    return () => setQueryErrorHandler(undefined);
  }, []);
};
