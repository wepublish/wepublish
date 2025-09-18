import { Alert, Snackbar } from '@mui/material';
import { ComponentType, memo, useEffect, useState } from 'react';

export const withErrorSnackbar = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object,
>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const [error, setError] = useState<string>();
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
      const url = new URL(window.location.href);
      const errorMsg = url.searchParams.get('error');

      if (errorMsg && error !== errorMsg) {
        setError(errorMsg);
        setOpen(true);
      }
    }, [error]);

    return (
      <>
        <ControlledComponent {...(props as P)} />

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
