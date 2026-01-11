import { campaigns } from '@mailchimp/mailchimp_marketing';
import { createContext } from 'react';

export const DailyBriefingContext = createContext<campaigns.Campaigns[]>([]);
