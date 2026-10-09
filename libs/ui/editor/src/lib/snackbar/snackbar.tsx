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
  /** Bold line above the message. */
  title?: ReactNode;
  /**
   * Milliseconds before the snackbar hides itself. `null` keeps it until the
   * user dismisses it — use it for errors the user must acknowledge.
   */
  autoHideDuration?: number | null;
  /** Reuse a key to replace an existing snackbar instead of stacking a new one. */
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

/**
 * Show a snackbar. Callable from anywhere — event handlers, effects, apollo
 * callbacks — without threading a context through.
 */
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

/** Close one snackbar, or all of them when no key is given. */
export const closeSnackbar = (key?: string) => {
  entries = key === undefined ? [] : entries.filter(entry => entry.key !== key);
  emit();
};

export type SnackbarHostProps = {
  /** How many snackbars may be visible at once. Oldest ones drop off. */
  maxSnack?: number;
  anchorOrigin?: SnackbarOrigin;
};

/**
 * Renders everything passed to `enqueueSnackbar`. Mount once near the app root.
 */
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
        // Newest snackbar nearest the anchored edge.
        flexDirection: vertical === 'top' ? 'column-reverse' : 'column',
      })}
    >
      {visible.map(entry => (
        // Each entry is its own Snackbar so MUI owns the auto-hide timer,
        // pause-on-hover and clickaway handling. `position: static` lets them
        // stack inside the container above instead of overlapping.
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
            sx={{ width: '100%' }}
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
