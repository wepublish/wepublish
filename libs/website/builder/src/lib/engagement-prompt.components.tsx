import { BuilderEngagementPromptProps } from './engagement-prompt.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const EngagementPrompt = (props: BuilderEngagementPromptProps) => {
  const { EngagementPrompt } = useWebsiteBuilder();

  return <EngagementPrompt {...props} />;
};
