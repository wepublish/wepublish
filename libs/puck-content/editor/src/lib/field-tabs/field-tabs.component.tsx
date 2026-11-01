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
    layout: t('puck.fieldTabs.layout'),
    content: t('puck.fieldTabs.content'),
    style: t('puck.fieldTabs.style'),
    data: t('puck.fieldTabs.data'),
    visibility: t('puck.fieldTabs.visibility'),
    general: t('puck.fieldTabs.general'),
    byline: t('puck.fieldTabs.byline'),
    publication: t('puck.fieldTabs.publication'),
    seo: t('puck.fieldTabs.seo'),
    socialMedia: t('puck.fieldTabs.socialMedia'),
    properties: t('puck.fieldTabs.properties'),
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
