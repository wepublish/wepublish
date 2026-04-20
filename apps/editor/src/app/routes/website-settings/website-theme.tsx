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
import { theme } from '@wepublish/ui';
import { PropsWithChildren, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { PaletteList } from './theme/palette-list';
import { themeSchema } from './theme/schema';
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

export const WebsiteTheme = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<number>(0);

  const form = useForm<z.infer<typeof themeSchema>>({
    resolver: zodResolver(themeSchema),
    mode: 'onTouched',
  });
  const { handleSubmit } = form;
  const onSubmit = handleSubmit(console.log, console.warn);

  const loading = Math.random() > 0.5;
  const defaultTheme = createTheme(theme, {});
  const data = {
    palette: defaultTheme.palette,
    typography: defaultTheme.typography,
  };

  const handleChange = (
    event: React.SyntheticEvent,
    newValue: typeof activeTab
  ) => {
    console.log(event, newValue);
    setActiveTab(newValue);
  };

  return (
    <WebsiteThemeWrapper onSubmit={onSubmit}>
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
          <PaletteList
            name={'palette'}
            defaultValue={data.palette}
          />
        </CustomTabPanel>

        <CustomTabPanel
          value={activeTab}
          activeValue={1}
        >
          <TypographyList
            name={'typography'}
            defaultValue={data.typography}
          />
        </CustomTabPanel>

        <Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading && (
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
    </WebsiteThemeWrapper>
  );
};
