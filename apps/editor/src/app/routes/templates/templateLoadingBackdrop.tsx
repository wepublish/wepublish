import { Backdrop, CircularProgress, Stack, Typography } from '@mui/material';

type TemplateLoadingBackdropProps = {
  open: boolean;
  label: string;
};

/** Covers the editor while a template it is prefilled from loads. */
export function TemplateLoadingBackdrop({
  open,
  label,
}: TemplateLoadingBackdropProps) {
  if (!open) {
    return null;
  }

  return (
    <Backdrop
      open
      sx={{ zIndex: theme => theme.zIndex.modal + 1 }}
    >
      <Stack
        alignItems="center"
        spacing={2}
        role="status"
      >
        <CircularProgress />
        <Typography>{label}</Typography>
      </Stack>
    </Backdrop>
  );
}
