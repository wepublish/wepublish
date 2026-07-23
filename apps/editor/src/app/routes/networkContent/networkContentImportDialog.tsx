import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { ArticleToImport, ImportOptions } from './networkContent.types';

interface NetworkContentImportDialogProps {
  articleToImport: ArticleToImport | undefined;
  importOptions: ImportOptions;
  importing: boolean;
  onOptionsChange: (options: ImportOptions) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function NetworkContentImportDialog({
  articleToImport,
  importOptions,
  importing,
  onOptionsChange,
  onConfirm,
  onClose,
}: NetworkContentImportDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={!!articleToImport}
      onClose={onClose}
    >
      <DialogTitle>{t('networkContentDashboard.importTitle')}</DialogTitle>

      <DialogContent>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={importOptions.importAuthors}
                onChange={(_, checked) =>
                  onOptionsChange({ ...importOptions, importAuthors: checked })
                }
              />
            }
            label={t('networkContentDashboard.importAuthors')}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={importOptions.importTags}
                onChange={(_, checked) =>
                  onOptionsChange({ ...importOptions, importTags: checked })
                }
              />
            }
            label={t('networkContentDashboard.importTags')}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={importOptions.importContentImages}
                onChange={(_, checked) =>
                  onOptionsChange({
                    ...importOptions,
                    importContentImages: checked,
                  })
                }
              />
            }
            label={t('networkContentDashboard.importImages')}
          />
        </FormGroup>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={importing}
        >
          {t('networkContentDashboard.cancel')}
        </Button>

        <Button
          variant="contained"
          disabled={importing}
          onClick={onConfirm}
        >
          {t('networkContentDashboard.importConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
