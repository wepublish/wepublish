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
  useUpdateWebsiteSettingsMutation,
  useWebsiteSettingsLazyQuery,
} from '@wepublish/editor/api';
import { minimalTheme } from '@wepublish/ui';
import { memo, PropsWithChildren, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Message, toaster } from 'rsuite';
import { z } from 'zod';

import { PaletteList } from './theme/palette-list';
import { normalizeTheme, themeSchema } from './theme/schema';
import { TypographyList } from './theme/typography-list';

const WebsiteThemeWrapper = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(250px, 500px) 1fr;
`;

const WebsiteThemeForm = styled.form`
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

  const [loadSettings, { data, loading }] = useWebsiteSettingsLazyQuery();
  const [updateWebsiteSettings, { loading: saving }] =
    useUpdateWebsiteSettingsMutation({
      onCompleted: () => {
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
            duration={3000}
          >
            {error.message}
          </Message>
        );
      },
    });

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
  const { handleSubmit, watch, getValues } = form;

  const onSubmit = handleSubmit(data => {
    updateWebsiteSettings({
      variables: {
        theme: data,
      },
    });
  }, console.warn);

  if (loading) {
    return (
      <CircularProgress
        size={14}
        color="inherit"
        sx={{ mr: 1 }}
      />
    );
  }

  const theme = themeSchema.safeParse(watch()).data ?? {};

  const previewQuery = JSON.stringify(theme);

  return (
    <WebsiteThemeWrapper onSubmit={onSubmit}>
      <Link
        to={'/settings/website'}
        css={{ gridColumn: '-1/1' }}
      >
        <Button
          size="small"
          variant="text"
          startIcon={<MdArrowBack />}
        >
          {t('websiteSettings.backToOverview')}
        </Button>
      </Link>

      <WebsiteThemeForm onSubmit={onSubmit}>
        <FormProvider {...form}>
          <Tabs
            value={activeTab}
            onChange={handleChange}
            aria-label="Theme tabs"
          >
            <Tab
              label="Palette"
              {...a11yProps(0)}
            />
            <Tab
              label="Typography"
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

          <Box>
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
          </Box>
        </FormProvider>
      </WebsiteThemeForm>

      <iframe
        css={{
          width: '100%',
          border: 0,
          height: '70vh',
          position: 'sticky',
          top: '0',
        }}
        src={`http://localhost:4200?PREVIEW_THEME=${encodeURIComponent(previewQuery)}`}
      />
    </WebsiteThemeWrapper>
  );
});
