import { useLazyQuery, useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  CircularProgress,
  createTheme,
  Tab,
  Tabs,
} from '@mui/material';
import {
  UpdateWebsiteSettingsDocument,
  WebsiteRemoteFontInput,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import { minimalTheme } from '@wepublish/ui';
import { humanizeError } from '@wepublish/ui/editor';
import { memo, PropsWithChildren, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdArrowBack, MdFileDownload, MdFileUpload } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Message, toaster } from 'rsuite';
import { z } from 'zod';

import { downloadJson } from './theme/download-json';
import { PaletteList } from './theme/palette-list';
import { normalizeTheme, themeSchema } from './theme/schema';
import {
  createThemeExport,
  mergeFonts,
  parseThemeImport,
} from './theme/theme-transfer';
import { TypographyList } from './theme/typography-list';

const WebsiteThemeWrapper = styled.form`
  display: grid;
  gap: 24px;
  grid-auto-columns: auto;
`;

type TabPanelProps = PropsWithChildren<{
  activeValue: number;
  value: number;
}>;

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, activeValue, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== activeValue}
      id={`simple-tabpanel-${activeValue}`}
      aria-labelledby={`simple-tab-${activeValue}`}
      css={{ maxWidth: 500 }}
      {...other}
    >
      {value === activeValue && children}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export const WebsiteTheme = memo(() => {
  const { t } = useTranslation();

  const [loadSettings, { loading, data: settings }] = useLazyQuery(
    WebsiteSettingsDocument
  );
  const websiteFonts: WebsiteRemoteFontInput[] = (
    settings?.websiteSettings.fonts ?? []
  ).map(({ name, weight, style }) => ({ name, weight, style }));
  const [importedFonts, setImportedFonts] = useState<WebsiteRemoteFontInput[]>(
    []
  );

  const [updateWebsiteSettings, { loading: saving }] = useMutation(
    UpdateWebsiteSettingsDocument,
    {
      onCompleted: () => {
        setImportedFonts([]);
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={3000}
          >
            {t('websiteSettings.saveSuccess')}
          </Message>
        );
      },
      onError: error => {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
            duration={8000}
          >
            {humanizeError(error)}
          </Message>
        );
      },
    }
  );

  const [activeTab, setActiveTab] = useState<number>(0);
  const handleChange = (
    event: React.SyntheticEvent,
    newValue: typeof activeTab
  ) => setActiveTab(newValue);

  const form = useForm<z.infer<typeof themeSchema>>({
    resolver: zodResolver(themeSchema),
    mode: 'onTouched',
    defaultValues: async payload => {
      const data = await loadSettings();

      return normalizeTheme(
        createTheme(minimalTheme, data.data?.websiteSettings.theme ?? {})
      );
    },
  });
  const { handleSubmit } = form;

  const onSubmit = handleSubmit(data => {
    updateWebsiteSettings({
      variables: {
        theme: data,
        // only sent when an import brought fonts the website does not have yet
        fonts: mergeFonts(websiteFonts, importedFonts),
      },
    });
  }, console.warn);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // validated like Save, so the file holds exactly what Save would store
  const exportTheme = handleSubmit(data => {
    downloadJson(createThemeExport(data, websiteFonts), 'website-theme.json');
  }, console.warn);

  const importTheme = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const { theme, fonts } = parseThemeImport(JSON.parse(await file.text()));

      form.reset(theme);
      setImportedFonts(fonts);

      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('websiteSettings.theme.importSuccess')}
        </Message>
      );
    } catch {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={5000}
        >
          {t('websiteSettings.theme.importError')}
        </Message>
      );
    }
  };

  if (loading) {
    return (
      <CircularProgress
        size={14}
        color="inherit"
        sx={{ mr: 1 }}
      />
    );
  }

  return (
    <WebsiteThemeWrapper onSubmit={onSubmit}>
      <Link to={'/settings/website'}>
        <Button
          size="small"
          variant="text"
          startIcon={<MdArrowBack />}
        >
          {t('websiteSettings.backToOverview')}
        </Button>
      </Link>

      <FormProvider {...form}>
        <Tabs
          value={activeTab}
          onChange={handleChange}
          aria-label={t('websiteSettings.theme.tabs')}
        >
          <Tab
            label={t('websiteSettings.theme.paletteTab')}
            {...a11yProps(0)}
          />
          <Tab
            label={t('websiteSettings.theme.typographyTab')}
            {...a11yProps(1)}
          />
        </Tabs>

        <CustomTabPanel
          value={activeTab}
          activeValue={0}
        >
          <PaletteList name={'palette'} />
        </CustomTabPanel>

        <CustomTabPanel
          value={activeTab}
          activeValue={1}
        >
          <TypographyList name={'typography'} />
        </CustomTabPanel>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving}
          >
            {saving && (
              <CircularProgress
                size={14}
                color="inherit"
                sx={{ mr: 1 }}
              />
            )}

            {t('save')}
          </Button>

          <Button
            type="button"
            variant="outlined"
            startIcon={<MdFileDownload />}
            onClick={exportTheme}
          >
            {t('websiteSettings.theme.exportTheme')}
          </Button>

          <Button
            type="button"
            variant="outlined"
            startIcon={<MdFileUpload />}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('websiteSettings.theme.importTheme')}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={importTheme}
          />
        </Box>
      </FormProvider>
    </WebsiteThemeWrapper>
  );
});
