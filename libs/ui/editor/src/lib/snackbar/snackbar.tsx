import {
  Alert,
  AlertColor,
  AlertTitle,
  Snackbar,
  SnackbarOrigin,
  Stack,
} from '@mui/material';
import { ReactNode, useSyncExternalStore } from 'react';

export type SnackbarVariant = AlertColor;

export type EnqueueSnackbarOptions = {
  variant?: SnackbarVariant;
  title?: ReactNode;
  autoHideDuration?: number | null;
  key?: string;
};

type SnackbarEntry = Required<Pick<EnqueueSnackbarOptions, 'variant'>> & {
  key: string;
  message: ReactNode;
  title?: ReactNode;
  autoHideDuration: number | null;
};

const DEFAULT_AUTO_HIDE_DURATION = 5000;

let entries: SnackbarEntry[] = [];
let nextKey = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(listener => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => void listeners.delete(listener);
};

const getSnapshot = () => entries;

export const enqueueSnackbar = (
  message: ReactNode,
  options: EnqueueSnackbarOptions = {}
) => {
  const key = options.key ?? `snackbar-${nextKey++}`;

  const entry: SnackbarEntry = {
    key,
    message,
    title: options.title,
    variant: options.variant ?? 'info',
    autoHideDuration:
      options.autoHideDuration === undefined ?
        DEFAULT_AUTO_HIDE_DURATION
      : options.autoHideDuration,
  };

  entries = [...entries.filter(item => item.key !== key), entry];
  emit();

  return key;
};

export const closeSnackbar = (key?: string) => {
  entries = key === undefined ? [] : entries.filter(entry => entry.key !== key);
  emit();
};

export type SnackbarHostProps = {
  maxSnack?: number;
  anchorOrigin?: SnackbarOrigin;
};

export function SnackbarHost({
  maxSnack = 3,
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
}: SnackbarHostProps) {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const visible = all.slice(-maxSnack);

  const { vertical, horizontal } = anchorOrigin;

  return (
    <Stack
      sx={theme => ({
        position: 'fixed',
        zIndex: theme.zIndex.snackbar,
        gap: 1,
        [vertical]: 24,
        ...(horizontal === 'center' ?
          { left: '50%', transform: 'translateX(-50%)' }
        : { [horizontal]: 24 }),
        alignItems:
          horizontal === 'left' ? 'flex-start'
          : horizontal === 'right' ? 'flex-end'
          : 'center',
        maxWidth: 'calc(100% - 48px)',
        flexDirection: vertical === 'top' ? 'column-reverse' : 'column',
      })}
    >
      {visible.map(entry => (
        <Snackbar
          key={entry.key}
          open
          autoHideDuration={entry.autoHideDuration}
          onClose={(_event, reason) =>
            reason === 'clickaway' ? undefined : closeSnackbar(entry.key)
          }
          sx={{ position: 'static', transform: 'none' }}
        >
          <Alert
            severity={entry.variant}
            variant="filled"
            onClose={() => closeSnackbar(entry.key)}
            sx={{
              width: '100%',
              alignItems: 'center',
              '& .MuiAlert-icon, & .MuiAlert-action': {
                alignItems: 'center',
                paddingBlock: 0,
                marginRight: 0,
              },
              '& .MuiAlert-icon': { marginRight: 1.5 },
              '& .MuiAlert-action': { marginLeft: 'auto', paddingLeft: 2 },
              ...(entry.message ? null : (
                { '& .MuiAlertTitle-root': { marginBottom: 0 } }
              )),
            }}
          >
            {entry.title ?
              <AlertTitle>{entry.title}</AlertTitle>
            : null}

            {entry.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}
