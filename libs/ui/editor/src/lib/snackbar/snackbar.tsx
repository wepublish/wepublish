import {
  Alert,
  AlertColor,
  AlertTitle,
  Box,
  Portal,
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
const DEFAULT_PROBLEM_AUTO_HIDE_DURATION = 10000;

const isProblem = (variant: SnackbarVariant) =>
  variant === 'error' || variant === 'warning';

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

  const variant = options.variant ?? 'info';
  const defaultDuration =
    isProblem(variant) ?
      DEFAULT_PROBLEM_AUTO_HIDE_DURATION
    : DEFAULT_AUTO_HIDE_DURATION;

  const entry: SnackbarEntry = {
    key,
    message,
    title: options.title,
    variant,
    autoHideDuration:
      options.autoHideDuration === undefined ?
        defaultDuration
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

const keepAnnouncedBehindModals = (region: HTMLDivElement | null) => {
  if (!region) {
    return;
  }

  const reveal = () => {
    if (region.getAttribute('aria-hidden') === 'true') {
      region.removeAttribute('aria-hidden');
    }
  };

  const observer = new MutationObserver(reveal);
  observer.observe(region, {
    attributes: true,
    attributeFilter: ['aria-hidden'],
  });
  reveal();

  return () => observer.disconnect();
};

export type SnackbarHostProps = {
  maxSnack?: number;
  anchorOrigin?: SnackbarOrigin;
  label?: string;
};

export function SnackbarHost({
  maxSnack = 3,
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
  label,
}: SnackbarHostProps) {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const visible = all.slice(-maxSnack);

  const { vertical, horizontal } = anchorOrigin;

  return (
    <Portal>
      <Box
        ref={keepAnnouncedBehindModals}
        component={label ? 'section' : 'div'}
        aria-label={label}
        sx={theme => ({
          position: 'fixed',
          zIndex: theme.zIndex.snackbar,
          [vertical]: 24,
          ...(horizontal === 'center' ?
            { left: '50%', transform: 'translateX(-50%)' }
          : { [horizontal]: 24 }),
          maxWidth: 'calc(100% - 48px)',
        })}
      >
        <Stack
          role="status"
          sx={{
            gap: 1,
            alignItems:
              horizontal === 'left' ? 'flex-start'
              : horizontal === 'right' ? 'flex-end'
              : 'center',
            flexDirection: vertical === 'top' ? 'column-reverse' : 'column',
          }}
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
                role={isProblem(entry.variant) ? 'alert' : 'none'}
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
      </Box>
    </Portal>
  );
}
