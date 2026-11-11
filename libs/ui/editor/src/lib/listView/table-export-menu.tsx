import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFileDownload } from 'react-icons/md';

import { ClickMenu } from '../popover/click-menu';
import { enqueueSnackbar } from '../snackbar';
import { TableExportFormat, TableExportScope } from './table-export';

const FORMATS: TableExportFormat[] = ['csv', 'xlsx'];

const LARGE_EXPORT = 1000;

export function TableExportMenu({
  onExport,
  pageCount,
  totalCount,
}: {
  onExport: (
    format: TableExportFormat,
    scope: TableExportScope
  ) => Promise<void>;
  pageCount: number;
  totalCount?: number;
}) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<TableExportFormat | null>(
    null
  );
  const [scope, setScope] = useState<TableExportScope>('all');

  const hasMoreRows = totalCount != null && totalCount > pageCount;

  async function startExport(
    format: TableExportFormat,
    exportScope: TableExportScope
  ) {
    setExporting(true);

    try {
      await onExport(format, exportScope);
    } catch (error) {
      enqueueSnackbar((error as Error).message, {
        variant: 'error',
        autoHideDuration: 8000,
      });
    } finally {
      setExporting(false);
    }
  }

  function chooseFormat(format: TableExportFormat) {
    if (!hasMoreRows) {
      startExport(format, 'all');
      return;
    }

    setScope('all');
    setPendingFormat(format);
  }

  function confirm() {
    if (pendingFormat) {
      startExport(pendingFormat, scope);
    }

    setPendingFormat(null);
  }

  return (
    <>
      <ClickMenu
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        trigger={
          <Button
            size="small"
            color="inherit"
            startIcon={<MdFileDownload />}
            loading={exporting}
            sx={{ color: 'text.secondary' }}
          >
            {t('listView.export.download')}
          </Button>
        }
      >
        {close =>
          FORMATS.map(format => (
            <MenuItem
              key={format}
              onClick={() => {
                close();
                chooseFormat(format);
              }}
            >
              {t(`listView.export.${format}`)}
            </MenuItem>
          ))
        }
      </ClickMenu>

      <Dialog
        open={pendingFormat !== null}
        onClose={() => setPendingFormat(null)}
      >
        <DialogTitle>{t('listView.export.scope.title')}</DialogTitle>

        <DialogContent>
          <RadioGroup
            value={scope}
            onChange={event => setScope(event.target.value as TableExportScope)}
          >
            <FormControlLabel
              value="page"
              control={<Radio />}
              label={t('listView.export.scope.page', { count: pageCount })}
            />
            <FormControlLabel
              value="all"
              control={<Radio />}
              label={t('listView.export.scope.all', { count: totalCount })}
            />
          </RadioGroup>

          {scope === 'all' && (totalCount ?? 0) > LARGE_EXPORT && (
            <Alert
              severity="warning"
              sx={{ mt: 1 }}
            >
              {t('listView.export.largeWarning', { count: totalCount })}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setPendingFormat(null)}
          >
            {t('listView.export.cancel')}
          </Button>

          <Button
            variant="contained"
            onClick={confirm}
          >
            {t('listView.export.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
