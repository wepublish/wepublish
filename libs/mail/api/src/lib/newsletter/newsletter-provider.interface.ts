import { SettingSyncProvider } from '@prisma/client';

export type NewsletterProviderConfig = SettingSyncProvider & {
  decryptedApiKey: string | null;
};

export interface NewsletterSubscribeProps {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}

export class NewsletterProviderError extends Error {}

export abstract class NewsletterProvider {
  constructor(protected readonly config: NewsletterProviderConfig) {}

  abstract subscribe(props: NewsletterSubscribeProps): Promise<void>;
}
