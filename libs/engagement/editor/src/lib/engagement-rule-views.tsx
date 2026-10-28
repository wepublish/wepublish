import { useQuery } from '@apollo/client/react';
import { Box, Tab, Tabs } from '@mui/material';
import { EngagementRulesDocument } from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { findConflicts } from './engagement-conflicts';
import { EngagementRuleForm } from './engagement-rule-form';
import { EngagementRuleOverview } from './engagement-rule-overview';
import {
  EngagementRuleValues,
  engagementRuleToValues,
} from './engagement-rule-values';

export type EngagementRuleView = 'edit' | 'overview';

const Overview = ({
  ruleId,
  actions,
}: {
  ruleId?: string;
  actions?: ReactNode;
}) => {
  const rule = useWatch<EngagementRuleValues>() as EngagementRuleValues;
  const { data } = useQuery(EngagementRulesDocument);
  const rules = data?.engagementRules ?? [];
  const self = rules.find(({ id }) => id === ruleId);

  return (
    <EngagementRuleOverview
      rule={rule}
      conflicts={findConflicts(
        { ...rule, id: ruleId, createdAt: self?.createdAt },
        rules.map(other => ({
          ...other,
          stages: engagementRuleToValues(other).stages,
        }))
      )}
      actions={actions}
    />
  );
};

type EngagementRuleViewsProps = {
  ruleId?: string;
  view: EngagementRuleView;
  onViewChange: (view: EngagementRuleView) => void;
  overviewActions?: ReactNode;
};

/**
 * The form and an overview of what the rule does, back and forth. The form
 * stays mounted while hidden, so nothing entered is lost.
 */
export const EngagementRuleViews = ({
  ruleId,
  view,
  onViewChange,
  overviewActions,
}: EngagementRuleViewsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Tabs
        value={view}
        onChange={(_event, next: EngagementRuleView) => onViewChange(next)}
        sx={{ mb: 2 }}
      >
        <Tab
          value="edit"
          label={t('engagement.view.edit')}
        />
        <Tab
          value="overview"
          label={t('engagement.view.overview')}
        />
      </Tabs>

      <Box hidden={view !== 'edit'}>
        <EngagementRuleForm ruleId={ruleId} />
      </Box>

      {view === 'overview' && (
        <Overview
          ruleId={ruleId}
          actions={overviewActions}
        />
      )}
    </>
  );
};
