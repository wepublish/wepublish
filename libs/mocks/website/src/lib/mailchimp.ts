import {
  AddMailchimpContactMutation,
  FullMailchimpFormBlockFragment,
} from '@wepublish/website/api';
import { definedOnly } from './overrides';

type MailchimpFormSuccessPage = NonNullable<
  FullMailchimpFormBlockFragment['successPage']
>;
type MailchimpFormSuccessOption = MailchimpFormSuccessPage['options'][number];
type MailchimpSubscribeResult =
  AddMailchimpContactMutation['addMailchimpContact'];

export const mockMailchimpFormSuccessOption = (
  overrides: Partial<MailchimpFormSuccessOption> = {}
): MailchimpFormSuccessOption => ({
  __typename: 'MailchimpFormSuccessOption',
  label: 'Back to the homepage',
  url: '/',
  background: '#000000',
  mergeFieldName: null,
  mergeFieldValue: null,
  ...definedOnly(overrides),
});

export const mockMailchimpFormSuccessPage = ({
  options = [mockMailchimpFormSuccessOption()],
  ...overrides
}: Partial<MailchimpFormSuccessPage> = {}): MailchimpFormSuccessPage => ({
  __typename: 'MailchimpFormSuccessPage',
  description: 'Thank you for subscribing! Please confirm your email address.',
  options,
  ...definedOnly(overrides),
});

export const mockMailchimpSubscribeResult = (
  overrides: Partial<MailchimpSubscribeResult> = {}
): MailchimpSubscribeResult => ({
  __typename: 'MailchimpSubscribeResult',
  success: true,
  error: null,
  ...definedOnly(overrides),
});
