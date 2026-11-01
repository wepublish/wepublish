import headingAnalyzer from '@puckeditor/plugin-heading-analyzer';
import { createElement } from 'react';
import { useTranslation } from 'react-i18next';

import { PluginPanelHeader } from './plugin-panel/plugin-panel-header.component';

export const HeadingAudit = () => {
  const { t } = useTranslation();

  return (
    <>
      <PluginPanelHeader
        title={t('puck.headingAudit.title')}
        subtitle={t('puck.headingAudit.subtitle')}
      />

      {headingAnalyzer.render && createElement(headingAnalyzer.render)}
    </>
  );
};
