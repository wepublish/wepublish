import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { EngagementRuleValues } from './engagement-rule-values';
import { summarizeStages } from './summarize-rule';

/** What a rule does, one stage per line. */
export const StageSummary = ({
  rule,
  testId,
}: {
  rule: Pick<EngagementRuleValues, 'goal' | 'stages'>;
  testId?: string;
}) => {
  const { t } = useTranslation();

  return (
    <Box
      component="ul"
      data-testid={testId}
      sx={{ m: 0, p: 0, listStyle: 'none' }}
    >
      {summarizeStages(rule, t).map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </Box>
  );
};
