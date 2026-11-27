import { DialogTitle, IconButton, Tooltip } from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';

export interface PreviewDialogTitleProps {
  children: ReactNode;
  onClose: () => void;
}

/**
 * The title of a preview dialog, with its close button in the top corner where
 * a large or full-screen preview still has it in sight.
 */
export function PreviewDialogTitle({
  children,
  onClose,
}: PreviewDialogTitleProps) {
  const { t } = useTranslation();
  const label = t('mailTemplates.editor.close');

  return (
    <DialogTitle sx={{ paddingRight: 7 }}>
      {children}
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12 }}
        >
          <MdClose />
        </IconButton>
      </Tooltip>
    </DialogTitle>
  );
}
