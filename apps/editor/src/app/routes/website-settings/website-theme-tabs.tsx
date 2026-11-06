import { Tab, Tabs } from '@mui/material';
import { PropsWithChildren, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PaletteList } from './theme/palette-list';
import { TypographyTab } from './theme/typography-tab';

type TabPanelProps = PropsWithChildren<{
  activeValue: number;
  value: number;
  maxWidth?: number | 'none';
}>;

function ThemeTabPanel({
  children,
  value,
  activeValue,
  maxWidth = 500,
}: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== activeValue}
      id={`simple-tabpanel-${activeValue}`}
      aria-labelledby={`simple-tab-${activeValue}`}
      css={{ maxWidth }}
    >
      {value === activeValue && children}
    </div>
  );
}

const tabProps = (index: number) => ({
  id: `simple-tab-${index}`,
  'aria-controls': `simple-tabpanel-${index}`,
});

export function WebsiteThemeTabs() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={(_event, tab: number) => setActiveTab(tab)}
        aria-label={t('websiteSettings.theme.tabs')}
      >
        <Tab
          label={t('websiteSettings.theme.paletteTab')}
          {...tabProps(0)}
        />
        <Tab
          label={t('websiteSettings.theme.typographyTab')}
          {...tabProps(1)}
        />
      </Tabs>

      <ThemeTabPanel
        value={activeTab}
        activeValue={0}
      >
        <PaletteList name="palette" />
      </ThemeTabPanel>

      <ThemeTabPanel
        value={activeTab}
        activeValue={1}
        maxWidth="none"
      >
        <TypographyTab name="typography" />
      </ThemeTabPanel>
    </>
  );
}
