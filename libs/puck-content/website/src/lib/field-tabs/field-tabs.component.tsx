import { Global } from '@emotion/react';
import { FieldTab } from '@puckeditor/core';
import { Fragment, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { FieldTabsLayout, FieldTabValue, groupFieldTabs } from './field-tabs';
import { fieldTabListStyles } from './field-tabs.styles';

export const FieldTabs = ({
  fields,
  layout,
}: {
  fields: Partial<Record<string, ReactNode>>;
  layout?: FieldTabsLayout;
}) => {
  const { t } = useTranslation();
  const labels: Record<FieldTabValue, string> = {
    layout: t('', 'Layout'),
    content: t('', 'Content'),
    style: t('', 'Style'),
    data: t('', 'Data'),
    visibility: t('', 'Visibility'),
    general: t('', 'General'),
    byline: t('', 'Byline'),
    publication: t('', 'Publication'),
    seo: t('', 'SEO'),
    socialMedia: t('', 'Social media'),
    properties: t('', 'Properties'),
  };
  const tabs = groupFieldTabs(Object.keys(fields), layout);
  const renderTab = (names: string[]) =>
    names.map(name => <Fragment key={name}>{fields[name]}</Fragment>);

  if (tabs.length === 1) {
    return renderTab(tabs[0].fields);
  }

  return (
    <>
      <Global styles={fieldTabListStyles} />
      {tabs.map(tab => (
        <FieldTab
          key={tab.value}
          value={tab.value}
          label={labels[tab.value]}
        >
          {renderTab(tab.fields)}
        </FieldTab>
      ))}
    </>
  );
};
