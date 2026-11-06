import { Button } from '@mui/material';
import { WebsiteRemoteFontInput } from '@wepublish/editor/api';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { ChangeEvent, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdFileDownload, MdFileUpload } from 'react-icons/md';

import { downloadJson } from './theme/download-json';
import { createThemeExport, parseThemeImport } from './theme/theme-transfer';
import {
  type WebsiteThemeValues,
  toThemeVariables,
} from './website-theme.schema';

type WebsiteThemeTransferProps = {
  websiteFonts: readonly WebsiteRemoteFontInput[];
};

export function WebsiteThemeTransfer({
  websiteFonts,
}: WebsiteThemeTransferProps) {
  const { t } = useTranslation();
  const form = useFormContext<WebsiteThemeValues>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportTheme = form.handleSubmit(values => {
    downloadJson(
      createThemeExport(toThemeVariables(values), websiteFonts),
      'website-theme.json'
    );
  });

  const importTheme = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const { theme, fonts } = parseThemeImport(JSON.parse(await file.text()));

      form.reset(
        { ...theme, importedFonts: fonts },
        { keepDefaultValues: true }
      );

      enqueueSnackbar(t('websiteSettings.theme.importSuccess'), {
        variant: 'success',
        autoHideDuration: 3000,
      });
    } catch {
      enqueueSnackbar(t('websiteSettings.theme.importError'), {
        variant: 'error',
        autoHideDuration: 5000,
      });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        startIcon={<MdFileUpload />}
        onClick={() => fileInputRef.current?.click()}
      >
        {t('websiteSettings.theme.importTheme')}
      </Button>

      <Button
        type="button"
        variant="outlined"
        startIcon={<MdFileDownload />}
        onClick={exportTheme}
      >
        {t('websiteSettings.theme.exportTheme')}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={importTheme}
      />
    </>
  );
}
