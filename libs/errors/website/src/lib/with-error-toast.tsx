import { Alert, Snackbar } from '@mui/material';
import { ComponentType, createElement, memo, useEffect, useState } from 'react';

import { translateApolloErrorMessage } from './api-alert';

export const withErrorSnackbar = <P extends object>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const [error, setError] = useState<string>();
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
      const url = new URL(window.location.href);
      const rawError = url.searchParams.get('error');
      const errorMsg = rawError ? translateApolloErrorMessage(rawError) : null;

      if (errorMsg && error !== errorMsg) {
        setError(errorMsg);
        setOpen(true);
      }
    }, [error]);

    return (
      <>
        {createElement(ControlledComponent, props as P)}

        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={open}
        >
          <Alert
            severity="error"
            variant="filled"
            onClose={() => setOpen(false)}
          >
            {error}
          </Alert>
        </Snackbar>
      </>
    );
  });
