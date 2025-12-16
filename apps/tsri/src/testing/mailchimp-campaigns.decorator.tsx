/* eslint-disable react/display-name */
import { campaigns } from '@mailchimp/mailchimp_marketing';
import { ComponentType } from 'react';

import { DailyBriefingContext } from '../components/teasers/teaser-sidebar-daily-briefing';

type MailchimpCampaignsDecoratorProps = {
  campaigns: campaigns.Campaigns[];
};
export const WithMailchimpCampaignsDecorator =
  ({ campaigns = [] }: MailchimpCampaignsDecoratorProps) =>
  (Story: ComponentType) => {
    return (
      <DailyBriefingContext.Provider value={campaigns}>
        <Story />
      </DailyBriefingContext.Provider>
    );
  };
